import {
  createStructuralDirectiveTransform,
  TransformContext
} from '../transform'
import {
  NodeTypes,
  ExpressionNode,
  createSimpleExpression,
  SourceLocation,
  SimpleExpressionNode,
  createCallExpression,
  createFunctionExpression,
  createObjectExpression,
  createObjectProperty,
  ForCodegenNode,
  RenderSlotCall,
  SlotOutletNode,
  ElementNode,
  DirectiveNode,
  ForNode,
  PlainElementNode,
  createVNodeCall,
  VNodeCall,
  ForRenderListExpression,
  BlockCodegenNode,
  ForIteratorExpression,
  ConstantTypes,
  createBlockStatement,
  createCompoundExpression
} from '../ast'
import { createCompilerError, ErrorCodes } from '../errors'
import {
  getInnerRange,
  findProp,
  isTemplateNode,
  isSlotOutlet,
  injectProp,
  getVNodeBlockHelper,
  getVNodeHelper,
  findDir
} from '../utils'
import {
  RENDER_LIST,
  OPEN_BLOCK,
  FRAGMENT,
  IS_MEMO_SAME
} from '../runtimeHelpers'
import { processExpression } from './transformExpression'
import { validateBrowserExpression } from '../validateExpression'
import { PatchFlags, PatchFlagNames } from '@vue/shared'

// 先通过结构化创建插件
export const transformFor = createStructuralDirectiveTransform(
  'for',
  // 添加阶段，会执行这个回调方法，返回 onExit
  (node, dir, context) => {
    // dir： v-for 指令属性节点
    const { helper, removeHelper } = context

    // transform for 添加阶段，返回 transform for onExit
    // processFor: 解析v-for指令节点，创建新的forNode节点并替换原先节点
    return processFor(node, dir, context, forNode => {
      // 还是处于 transform for 添加阶段，执行这个回调，返回 transform的 onExit

      // create the loop render function expression now, and add the
      // iterator on exit after all children have been traversed

      // 创建 一个函数执行的表达式
      // 其中 arguments - 遍历回调： 在执行transform阶段 设置，并重新调整子列表
      const renderExp = createCallExpression(helper(RENDER_LIST), [
        // RENDER_LIST = Symbol(__DEV__ ? `renderList` : ``)
        forNode.source // 遍历目标信息
      ]) as ForRenderListExpression

      const isTemplate = isTemplateNode(node)
      const memo = findDir(node, 'memo')
      // 设置 key 属性
      // 如 <div v-for="(item, index) in items" :key="index"></div>
      const keyProp = findProp(node, `key`)
      const keyExp =
        keyProp &&
        (keyProp.type === NodeTypes.ATTRIBUTE
          ? createSimpleExpression(keyProp.value!.content, true)
          : keyProp.exp!)
      const keyProperty = keyProp ? createObjectProperty(`key`, keyExp!) : null // 如果不存在， 就不设置

      if (!__BROWSER__ && isTemplate) {
        // #2085 / #5288 process :key and v-memo expressions need to be
        // processed on `<template v-for>`. In this case the node is discarded
        // and never traversed so its binding expressions won't be processed
        // by the normal transforms.
        if (memo) {
          memo.exp = processExpression(
            memo.exp! as SimpleExpressionNode,
            context
          )
        }
        if (keyProperty && keyProp!.type !== NodeTypes.ATTRIBUTE) {
          keyProperty.value = processExpression(
            keyProperty.value as SimpleExpressionNode,
            context
          )
        }
      }

      // 默认false
      const isStableFragment =
        forNode.source.type === NodeTypes.SIMPLE_EXPRESSION && // true
        forNode.source.constType > ConstantTypes.NOT_CONSTANT // 默认为 ConstantTypes.NOT_CONSTANT 0 则 false , (注意 cfs环境)
      const fragmentFlag = isStableFragment // 默认false
        ? PatchFlags.STABLE_FRAGMENT // 稳定片段
        : keyProp // 带key属性节点
        ? PatchFlags.KEYED_FRAGMENT // 带key的片段 <div v-for="(item, index) in items" :key="index"></div>
        : PatchFlags.UNKEYED_FRAGMENT //  <div v-for="(item, index) in items"></div>

      forNode.codegenNode = createVNodeCall(
        context,
        helper(FRAGMENT), // FRAGMENT = Symbol(__DEV__ ? `Fragment` : ``)
        undefined,
        renderExp, //  forNode.source 渲染表达式值节点
        fragmentFlag +
          (__DEV__ ? ` /* ${PatchFlagNames[fragmentFlag]} */` : ``),
        undefined,
        undefined,
        true /* isBlock */,
        !isStableFragment /* disableTracking */,
        false /* isComponent */,
        node.loc
      ) as ForCodegenNode

      // 执行 transform for 插件（以上为 添加 插件阶段）
      // transform 执行阶段，只执行这个返回方法
      return () => {
        // 执行阶段，根据子节点情况调整子节点列表：slot节点、多子节点、单标签元素子节点
        // finish the codegen now that all children have been traversed
        let childBlock: BlockCodegenNode
        const { children } = forNode

        // check <template v-for> key placement
        if ((__DEV__ || !__BROWSER__) && isTemplate) {
          node.children.some(c => {
            if (c.type === NodeTypes.ELEMENT) {
              const key = findProp(c, 'key')
              if (key) {
                // 如 <template v-for>，在其子元素列表中 不该存在key属性
                context.onError(
                  createCompilerError(
                    ErrorCodes.X_V_FOR_TEMPLATE_KEY_PLACEMENT, // <template v-for> key should be placed on the <template> tag.
                    key.loc
                  )
                )
                return true
              }
            }
          })
        }

        // 多个节点 或 首个子节点是非标签节点（即文本、注释等）
        const needFragmentWrapper =
          children.length !== 1 || children[0].type !== NodeTypes.ELEMENT

        // 遍历slot标签节点：<slot v-for> 或 <template v-for><slot>
        const slotOutlet = isSlotOutlet(node)
          ? node // <slot v-for="...">
          : isTemplate &&
            node.children.length === 1 &&
            isSlotOutlet(node.children[0]) //  只有一个slot子节点 <template v-for><slot>...</slot></template>，
          ? (node.children[0] as SlotOutletNode) // api-extractor somehow fails to infer this
          : null

        if (slotOutlet) {
          // <slot v-for="..."> or <template v-for="..."><slot/></template>
          // slot解析：transformSlotOutlet
          childBlock = slotOutlet.codegenNode as RenderSlotCall

          if (isTemplate && keyProperty) {
            // template节点仅有一个slot子节点 如：<template v-for="..." :key="..."><slot/></template>

            // we need to inject the key to the renderSlot() call.
            // the props for renderSlot is passed as the 3rd argument.
            // 将template元素上的key 属性注入到slot元素的prop属性列表中去
            injectProp(childBlock, keyProperty, context)
          }
        } else if (needFragmentWrapper) {
          // 多个子节点：如多个标签节点 或 多个文本节点（文本/插值/注释）
          // <template v-for>...</template>

          // should generate a fragment block for each loop
          childBlock = createVNodeCall(
            context,
            helper(FRAGMENT),
            keyProperty ? createObjectExpression([keyProperty]) : undefined, // 创建 key属性节点
            node.children, // 子节点列表
            PatchFlags.STABLE_FRAGMENT +
              (__DEV__
                ? ` /* ${PatchFlagNames[PatchFlags.STABLE_FRAGMENT]} */`
                : ``),
            undefined,
            undefined,
            true, // 创建块
            undefined,
            false /* isComponent */
          )
        } else {
          // 只有一个子节点，且是标签元素
          // Normal element v-for. Directly use the child's codegenNode
          // but mark it as a block.

          childBlock = (children[0] as PlainElementNode) // children[0]，即for 元素节点， codegenNode 在 transformElement节点生成 createVNodeCall
            .codegenNode as VNodeCall
          if (isTemplate && keyProperty) {
            // 如果是一个template v-for，且存在key，且只有一个子元素，则需要将key属性注入到
            // 如 <template v-for="..." :key="ddd"><div>...</div></template>
            // childBlock，即子节点： <div>...</div> 的codegenNode 在 transformElement节点生成 createVNodeCall
            injectProp(childBlock, keyProperty, context)
          }
          if (childBlock.isBlock !== !isStableFragment) {
            if (childBlock.isBlock) {
              // switch from block to vnode
              removeHelper(OPEN_BLOCK)
              removeHelper(
                getVNodeBlockHelper(context.inSSR, childBlock.isComponent)
              )
            } else {
              // switch from vnode to block
              removeHelper(
                getVNodeHelper(context.inSSR, childBlock.isComponent)
              )
            }
          }
          childBlock.isBlock = !isStableFragment // v-for 元素 默认使用 block
          if (childBlock.isBlock) {
            helper(OPEN_BLOCK) // Symbol(__DEV__ ? `openBlock` : ``)
            helper(getVNodeBlockHelper(context.inSSR, childBlock.isComponent))
          } else {
            helper(getVNodeHelper(context.inSSR, childBlock.isComponent))
          }
        }

        if (memo) {
          const loop = createFunctionExpression(
            createForLoopParams(forNode.parseResult, [
              createSimpleExpression(`_cached`)
            ])
          )
          loop.body = createBlockStatement([
            createCompoundExpression([`const _memo = (`, memo.exp!, `)`]),
            createCompoundExpression([
              `if (_cached`,
              ...(keyExp ? [` && _cached.key === `, keyExp] : []),
              ` && ${context.helperString(
                IS_MEMO_SAME
              )}(_cached, _memo)) return _cached`
            ]),
            createCompoundExpression([`const _item = `, childBlock as any]),
            createSimpleExpression(`_item.memo = _memo`),
            createSimpleExpression(`return _item`)
          ])
          renderExp.arguments.push(
            loop as ForIteratorExpression,
            createSimpleExpression(`_cache`),
            createSimpleExpression(String(context.cached++))
          )
        } else {
          renderExp.arguments.push(
            createFunctionExpression(
              createForLoopParams(forNode.parseResult),
              childBlock,
              true /* force newline */
            ) as ForIteratorExpression
          )
        }
      }
    })
  }
)

// target-agnostic transform used for both Client and SSR
export function processFor(
  node: ElementNode,
  dir: DirectiveNode,
  context: TransformContext,
  processCodegen?: (forNode: ForNode) => (() => void) | undefined
) {
  if (!dir.exp) {
    // v-for 需要表达式值
    context.onError(
      createCompilerError(ErrorCodes.X_V_FOR_NO_EXPRESSION, dir.loc) // v-for is missing expression.
    )
    return
  }

  // 解析v-for 表达式值
  const parseResult = parseForExpression(
    // can only be simple expression because vFor transform is applied
    // before expression transform. 即 插件transformExpression 之前
    dir.exp as SimpleExpressionNode,
    context
  )

  if (!parseResult) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION, dir.loc)
    )
    return
  }

  const { addIdentifiers, removeIdentifiers, scopes } = context
  const { source, value, key, index } = parseResult

  // 创建一个新的for 节点元素 为了替换旧节点
  const forNode: ForNode = {
    type: NodeTypes.FOR, // 节点类型
    loc: dir.loc,
    source, // v-for in/of 右侧遍历目标节点
    valueAlias: value, // value节点
    keyAlias: key, // key 节点
    objectIndexAlias: index, // index 节点
    parseResult, // v-for 表达式解析结果
    children: isTemplateNode(node) ? node.children : [node] // <template v-for="xxx"><div>...</div></template>
  }

  // 替换当前的for node 节点
  context.replaceNode(forNode)

  // bookkeeping
  // transform 添加阶段
  scopes.vFor++ // 记录是否存在嵌套v-for

  // TODO: analyze - !__BROWSER__
  if (!__BROWSER__ && context.prefixIdentifiers) {
    // scope management
    // inject identifiers to context
    value && addIdentifiers(value)
    key && addIdentifiers(key)
    index && addIdentifiers(index)
  }

  const onExit = processCodegen && processCodegen(forNode)

  // transform 的 onExit
  // 在 transform 执行阶段，执行这个方法
  return () => {
    // transform 执行阶段
    scopes.vFor-- // 当前解析的v-for指令
    if (!__BROWSER__ && context.prefixIdentifiers) {
      value && removeIdentifiers(value)
      key && removeIdentifiers(key)
      index && removeIdentifiers(index)
    }
    if (onExit) onExit()
  }
}

// v-for 指令值内容匹配
const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/

// This regex doesn't cover the case if key or index aliases have destructuring,
// but those do not make sense in the first place, so this works in practice.
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/ // in/of 左侧内容，如 v-for="item in items" 或 v-for="(value, key, index) in object" 匹配其中 ', key, index'
const stripParensRE = /^\(|\)$/g // v-for= "(...) in/of ..." 左侧括号

export interface ForParseResult {
  source: ExpressionNode
  value: ExpressionNode | undefined
  key: ExpressionNode | undefined
  index: ExpressionNode | undefined
}

// 解析 v-for 表达式值，分析 in/of 左侧/右侧内容，并设置左侧的key、value、index节点信息，同时也进行了js语法校验
export function parseForExpression(
  input: SimpleExpressionNode, // v-for指令节点的表达式值
  context: TransformContext
): ForParseResult | undefined {
  const loc = input.loc
  const exp = input.content

  // 匹配for规则： /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  //
  // 其中 \s 匹配任何空白字符、 \S 匹配任何非空白字符，如：
  //
  //    <div v-for="item in items"></div>
  //    <div v-for="(item, index) in items"></div>
  //    <div v-for="(item, index) in [item1, item2...]"></div>
  //    <div v-for="(value, key) in object"></div>
  //    <div v-for="(value, key, index) in object"></div>

  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return

  // 如 <div v-for="(item, index) in items"></div>
  // LHS: 表示 in/of 左边内容 （正则捕获组1） '(item, index)'
  // RHS: 表示 in/of 右边内容 （正则捕获组2） 'items'
  // 均不包括in/of相邻的空白
  const [, LHS, RHS] = inMatch

  const result: ForParseResult = {
    // 右侧目标 createSimpleExpression，js ast 函数参数节点
    source: createAliasExpression(
      // 创建一个表达式节点，且带单独针对in/of左侧内容的光标位置信息
      loc,
      RHS.trim(), // 遍历目标
      exp.indexOf(RHS, LHS.length) // 遍历目标的位置，跳过in/of左边内容
    ),
    // 左侧目标
    value: undefined, // createAliasExpression(loc, valueContent, trimmedOffset)
    key: undefined, // createAliasExpression(loc, keyContent, keyOffset)
    index: undefined // createAliasExpression(loc, indexContent, index源码光标位置)
  }

  // TODO: analyze - !__BROWSER__
  if (!__BROWSER__ && context.prefixIdentifiers) {
    result.source = processExpression(
      result.source as SimpleExpressionNode,
      context
    )
  }
  if (__DEV__ && __BROWSER__) {
    // 检查for in/of 右侧遍历目标的js语法是否规范
    validateBrowserExpression(result.source as SimpleExpressionNode, context)
  }

  // 解析 in/of 左边内容: value, key, index  以逗号 ',' 分隔

  // value， 如 <div v-for="(value, key, index) in object"></div> 其中的 'value, key, index'
  let valueContent = LHS.trim().replace(stripParensRE, '').trim() // 去掉括号 /^\(|\)$/g
  const trimmedOffset = LHS.indexOf(valueContent) // 内容位置

  const iteratorMatch = valueContent.match(forIteratorRE) // 匹配展示的值内容，如 <div v-for="(value, key, index) in object"></div> 其中的 'value, key, index'
  if (iteratorMatch) {
    // 如 <div v-for="(value, key, index) in object"></div> 其中的 'value, key, index'
    // match[0] 为 匹配到的内容 ', key, index'
    // match[1] 为 key
    // match[2] 为 index

    // 解析 v-for value， 去掉 ', key, index' 保留其中 'value' 内容部分
    valueContent = valueContent.replace(forIteratorRE, '').trim()

    // 解析 v-for key，创建 key 的 js ast 节点
    const keyContent = iteratorMatch[1].trim()
    let keyOffset: number | undefined
    if (keyContent) {
      keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length) // key 相对左侧偏移量
      result.key = createAliasExpression(loc, keyContent, keyOffset) // 创建 key 节点

      // TODO: analyze - !__BROWSER__
      if (!__BROWSER__ && context.prefixIdentifiers) {
        result.key = processExpression(result.key, context, true)
      }
      if (__DEV__ && __BROWSER__) {
        // 校验 key js 语法
        validateBrowserExpression(
          result.key as SimpleExpressionNode,
          context,
          true // js 语法验证 result.key.content 是否以参数，还是函数体
        )
      }
    }

    // 解析 v-for index
    if (iteratorMatch[2]) {
      const indexContent = iteratorMatch[2].trim()

      if (indexContent) {
        // 创建 index 的 js ast 节点
        result.index = createAliasExpression(
          loc,
          indexContent,
          exp.indexOf(
            // 定位 index 源码位置
            indexContent,
            result.key
              ? keyOffset! + keyContent.length // 存在 key，如 <div v-for="(value, key, index) in object"></div>
              : trimmedOffset + valueContent.length // 不存在key，如 <div v-for="(value, , index) in object"></div>
          )
        )

        // TODO: analyze - !__BROWSER__
        if (!__BROWSER__ && context.prefixIdentifiers) {
          result.index = processExpression(result.index, context, true)
        }

        if (__DEV__ && __BROWSER__) {
          // 校验 index js 语法
          validateBrowserExpression(
            result.index as SimpleExpressionNode,
            context,
            true
          )
        }
      }
    }
  }

  // 解析 value

  if (valueContent) {
    result.value = createAliasExpression(loc, valueContent, trimmedOffset)

    // TODO: analyze - !__BROWSER__
    if (!__BROWSER__ && context.prefixIdentifiers) {
      result.value = processExpression(result.value, context, true)
    }

    if (__DEV__ && __BROWSER__) {
      // 验证 value js 语法
      validateBrowserExpression(
        result.value as SimpleExpressionNode,
        context,
        true
      )
    }
  }

  return result
}

// 创建一个表达式节点，且带单独的光标位置信息
function createAliasExpression(
  range: SourceLocation, // 节点在模版中的位置信息
  content: string, // 当前内容
  offset: number // 偏移量
): SimpleExpressionNode {
  return createSimpleExpression(
    content,
    false,
    getInnerRange(range, offset, content.length) // 获取content在ast模版中的光标位置
  )
}

// v-for 渲染源码回调函数的参数：item, key, index
// 如    _renderList(items, (item, key, index) => {
//         return {
//           name: item.name,
//           fn: _withCtx((slotProps) => [
//             _createTextVNode("嘿嘿嘿 " + _toDisplayString(item.name), 1 /* TEXT */)
//           ])
//         }
//       }
export function createForLoopParams(
  { value, key, index }: ForParseResult,
  memoArgs: ExpressionNode[] = []
): ExpressionNode[] {
  return createParamsList([value, key, index, ...memoArgs])
}

function createParamsList(
  args: (ExpressionNode | undefined)[]
): ExpressionNode[] {
  let i = args.length
  while (i--) {
    if (args[i]) break
  }
  return args
    .slice(0, i + 1)
    .map((arg, i) => arg || createSimpleExpression(`_`.repeat(i + 1), false))
}
