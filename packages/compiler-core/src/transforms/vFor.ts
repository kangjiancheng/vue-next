import {
  type TransformContext,
  createStructuralDirectiveTransform,
} from '../transform'
import {
  type BlockCodegenNode,
  ConstantTypes,
  type DirectiveNode,
  type ElementNode,
  type ExpressionNode,
  type ForCodegenNode,
  type ForIteratorExpression,
  type ForNode,
  type ForParseResult,
  type ForRenderListExpression,
  NodeTypes,
  type PlainElementNode,
  type RenderSlotCall,
  type SimpleExpressionNode,
  type SlotOutletNode,
  type VNodeCall,
  createBlockStatement,
  createCallExpression,
  createCompoundExpression,
  createFunctionExpression,
  createObjectExpression,
  createObjectProperty,
  createSimpleExpression,
  createVNodeCall,
  getVNodeBlockHelper,
  getVNodeHelper,
} from '../ast'
import { ErrorCodes, createCompilerError } from '../errors'
import {
  findDir,
  findProp,
  injectProp,
  isSlotOutlet,
  isTemplateNode,
} from '../utils'
import {
  FRAGMENT,
  IS_MEMO_SAME,
  OPEN_BLOCK,
  RENDER_LIST,
} from '../runtimeHelpers'
import { processExpression } from './transformExpression'
import { validateBrowserExpression } from '../validateExpression'
import { PatchFlagNames, PatchFlags } from '@vue/shared'
import { transformBindShorthand } from './vBind'

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
        forNode.source, // 遍历目标信息
      ]) as ForRenderListExpression

      const isTemplate = isTemplateNode(node)
      const memo = findDir(node, 'memo')
      // 设置 key 属性
      // 如 <div v-for="(item, index) in items" :key="index"></div>
      const keyProp = findProp(node, `key`, false, true)
      if (keyProp && keyProp.type === NodeTypes.DIRECTIVE && !keyProp.exp) {
        // resolve :key shorthand #10882
        transformBindShorthand(keyProp, context)
      }
      const keyExp =
        keyProp &&
        (keyProp.type === NodeTypes.ATTRIBUTE
          ? keyProp.value
            ? createSimpleExpression(keyProp.value.content, true)
            : undefined
          : keyProp.exp)
      const keyProperty =
        keyProp && keyExp ? createObjectProperty(`key`, keyExp) : null // 如果不存在， 就不设置

      if (!__BROWSER__ && isTemplate) {
        // #2085 / #5288 process :key and v-memo expressions need to be
        // processed on `<template v-for>`. In this case the node is discarded
        // and never traversed so its binding expressions won't be processed
        // by the normal transforms.
        if (memo) {
          memo.exp = processExpression(
            memo.exp! as SimpleExpressionNode,
            context,
          )
        }
        if (keyProperty && keyProp!.type !== NodeTypes.ATTRIBUTE) {
          keyProperty.value = processExpression(
            keyProperty.value as SimpleExpressionNode,
            context,
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
        node.loc,
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
                    key.loc,
                  ),
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
            false /* isComponent */,
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
                getVNodeBlockHelper(context.inSSR, childBlock.isComponent),
              )
            } else {
              // switch from vnode to block
              removeHelper(
                getVNodeHelper(context.inSSR, childBlock.isComponent),
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
              createSimpleExpression(`_cached`),
            ]),
          )
          loop.body = createBlockStatement([
            createCompoundExpression([`const _memo = (`, memo.exp!, `)`]),
            createCompoundExpression([
              `if (_cached`,
              ...(keyExp ? [` && _cached.key === `, keyExp] : []),
              ` && ${context.helperString(
                IS_MEMO_SAME,
              )}(_cached, _memo)) return _cached`,
            ]),
            createCompoundExpression([`const _item = `, childBlock as any]),
            createSimpleExpression(`_item.memo = _memo`),
            createSimpleExpression(`return _item`),
          ])
          renderExp.arguments.push(
            loop as ForIteratorExpression,
            createSimpleExpression(`_cache`),
            createSimpleExpression(String(context.cached++)),
          )
        } else {
          renderExp.arguments.push(
            createFunctionExpression(
              createForLoopParams(forNode.parseResult),
              childBlock,
              true /* force newline */,
            ) as ForIteratorExpression,
          )
        }
      }
    })
  },
)

// target-agnostic transform used for both Client and SSR
export function processFor(
  node: ElementNode,
  dir: DirectiveNode,
  context: TransformContext,
  processCodegen?: (forNode: ForNode) => (() => void) | undefined,
) {
  if (!dir.exp) {
    // v-for 需要表达式值
    context.onError(
      createCompilerError(ErrorCodes.X_V_FOR_NO_EXPRESSION, dir.loc), // v-for is missing expression.
    )
    return
  }

  // 解析v-for 表达式值
  const parseResult = dir.forParseResult

  if (!parseResult) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION, dir.loc),
    )
    return
  }

  finalizeForParseResult(parseResult, context)

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
    children: isTemplateNode(node) ? node.children : [node], // <template v-for="xxx"><div>...</div></template>
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

export function finalizeForParseResult(
  result: ForParseResult,
  context: TransformContext,
) {
  if (result.finalized) return

  if (!__BROWSER__ && context.prefixIdentifiers) {
    result.source = processExpression(
      result.source as SimpleExpressionNode,
      context,
    )
    if (result.key) {
      result.key = processExpression(
        result.key as SimpleExpressionNode,
        context,
        true,
      )
    }
    if (result.index) {
      result.index = processExpression(
        result.index as SimpleExpressionNode,
        context,
        true,
      )
    }
    if (result.value) {
      result.value = processExpression(
        result.value as SimpleExpressionNode,
        context,
        true,
      )
    }
  }

  if (__DEV__ && __BROWSER__) {
    validateBrowserExpression(result.source as SimpleExpressionNode, context)
    if (result.key) {
      validateBrowserExpression(
        result.key as SimpleExpressionNode,
        context,
        true,
      )
    }
    if (result.index) {
      validateBrowserExpression(
        result.index as SimpleExpressionNode,
        context,
        true,
      )
    }
    if (result.value) {
      validateBrowserExpression(
        result.value as SimpleExpressionNode,
        context,
        true,
      )
    }
  }
  result.finalized = true
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
  memoArgs: ExpressionNode[] = [],
): ExpressionNode[] {
  return createParamsList([value, key, index, ...memoArgs])
}

function createParamsList(
  args: (ExpressionNode | undefined)[],
): ExpressionNode[] {
  let i = args.length
  while (i--) {
    if (args[i]) break
  }
  return args
    .slice(0, i + 1)
    .map((arg, i) => arg || createSimpleExpression(`_`.repeat(i + 1), false))
}
