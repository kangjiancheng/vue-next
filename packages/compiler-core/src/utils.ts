import {
  type BlockCodegenNode,
  type CallExpression,
  type DirectiveNode,
  type ElementNode,
  ElementTypes,
  type ExpressionNode,
  type IfBranchNode,
  type InterpolationNode,
  type JSChildNode,
  type MemoExpression,
  NodeTypes,
  type ObjectExpression,
  type Position,
  type Property,
  type RenderSlotCall,
  type RootNode,
  type SimpleExpressionNode,
  type SlotOutletNode,
  type TemplateChildNode,
  type TemplateNode,
  type TextNode,
  type VNodeCall,
  createCallExpression,
  createObjectExpression,
} from './ast'
import type { TransformContext } from './transform'
import {
  BASE_TRANSITION,
  GUARD_REACTIVE_PROPS,
  KEEP_ALIVE,
  MERGE_PROPS,
  NORMALIZE_PROPS,
  SUSPENSE,
  TELEPORT,
  TO_HANDLERS,
  WITH_MEMO,
} from './runtimeHelpers'
import { NOOP, isObject, isString } from '@vue/shared'
import type { PropsExpression } from './transforms/transformElement'
import { parseExpression } from '@babel/parser'
import type { Expression } from '@babel/types'
import { unwrapTSNode } from './babelUtils'

// 判断一个指令属性节点是否是静态指令;  (动态指令：':[dynamicName]="value"')
export const isStaticExp = (p: JSChildNode): p is SimpleExpressionNode =>
  // 指令名节点表达式，如 template: <component :is='HelloWold' />， 静态is返回true
  p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic

export function isCoreComponent(tag: string): symbol | void {
  switch (tag) {
    case 'Teleport':
    case 'teleport':
      return TELEPORT
    case 'Suspense':
    case 'suspense':
      return SUSPENSE
    case 'KeepAlive':
    case 'keep-alive':
      return KEEP_ALIVE
    case 'BaseTransition':
    case 'base-transition':
      return BASE_TRANSITION
  }
}

// 数字开头：'123abc$'
// 或不能只有： $、字母、数字、下划线，比如 '{foo:true}'
const nonIdentifierRE = /^\d|[^\$\w\xA0-\uFFFF]/
// 非数字开头，且都是'[\$A-Za-z0-9_]'，如：'$foo_123'
export const isSimpleIdentifier = (name: string): boolean =>
  !nonIdentifierRE.test(name)

// \w 匹配字母、数字、下划线。等价于'[A-Za-z0-9_]'。
// \W 匹配非字母、数字、下划线。等价于 '[^A-Za-z0-9_]'。
// \s 匹配任何空白字符，包括空格、制表符、换页符等等。等价于 [ \f\n\r\t\v]。
// \S 匹配任何非空白字符。等价于 [^ \f\n\r\t\v]。

// 匹配一个指令属性值的表达式，即有效的函数名调用： 以 [A-Za-z_$] 开头，如 <button @click="$_abc[foo][bar]"></button>
// '$_abc$123 . $_abc$123$ . $_abc$123' 或 '$_abc[foo][bar]'
// 不匹配： '1 + 1'、handleClick(1)
enum MemberExpLexState {
  inMemberExp,
  inBrackets,
  inParens,
  inString,
}

const validFirstIdentCharRE = /[A-Za-z_$\xA0-\uFFFF]/
const validIdentCharRE = /[\.\?\w$\xA0-\uFFFF]/
const whitespaceRE = /\s+[.[]\s*|\s*[.[]\s+/g

/**
 * Simple lexer to check if an expression is a member expression. This is
 * lax and only checks validity at the root level (i.e. does not validate exps
 * inside square brackets), but it's ok since these are only used on template
 * expressions and false positives are invalid expressions in the first place.
 */
export const isMemberExpressionBrowser = (path: string): boolean => {
  // remove whitespaces around . or [ first
  path = path.trim().replace(whitespaceRE, s => s.trim())

  let state = MemberExpLexState.inMemberExp
  let stateStack: MemberExpLexState[] = []
  let currentOpenBracketCount = 0
  let currentOpenParensCount = 0
  let currentStringType: "'" | '"' | '`' | null = null

  for (let i = 0; i < path.length; i++) {
    const char = path.charAt(i)
    switch (state) {
      case MemberExpLexState.inMemberExp:
        if (char === '[') {
          stateStack.push(state)
          state = MemberExpLexState.inBrackets
          currentOpenBracketCount++
        } else if (char === '(') {
          stateStack.push(state)
          state = MemberExpLexState.inParens
          currentOpenParensCount++
        } else if (
          !(i === 0 ? validFirstIdentCharRE : validIdentCharRE).test(char)
        ) {
          return false
        }
        break
      case MemberExpLexState.inBrackets:
        if (char === `'` || char === `"` || char === '`') {
          stateStack.push(state)
          state = MemberExpLexState.inString
          currentStringType = char
        } else if (char === `[`) {
          currentOpenBracketCount++
        } else if (char === `]`) {
          if (!--currentOpenBracketCount) {
            state = stateStack.pop()!
          }
        }
        break
      case MemberExpLexState.inParens:
        if (char === `'` || char === `"` || char === '`') {
          stateStack.push(state)
          state = MemberExpLexState.inString
          currentStringType = char
        } else if (char === `(`) {
          currentOpenParensCount++
        } else if (char === `)`) {
          // if the exp ends as a call then it should not be considered valid
          if (i === path.length - 1) {
            return false
          }
          if (!--currentOpenParensCount) {
            state = stateStack.pop()!
          }
        }
        break
      case MemberExpLexState.inString:
        if (char === currentStringType) {
          state = stateStack.pop()!
          currentStringType = null
        }
        break
    }
  }
  return !currentOpenBracketCount && !currentOpenParensCount
}

// 获取节点中的内部某段内容的光标信息
export const isMemberExpressionNode = __BROWSER__
  ? (NOOP as any as (path: string, context: TransformContext) => boolean)
  : (path: string, context: TransformContext): boolean => {
      try {
        let ret: Expression = parseExpression(path, {
          plugins: context.expressionPlugins,
        })
        ret = unwrapTSNode(ret) as Expression
        return (
          ret.type === 'MemberExpression' ||
          ret.type === 'OptionalMemberExpression' ||
          (ret.type === 'Identifier' && ret.name !== 'undefined')
        )
      } catch (e) {
        return false
      }
    }

export const isMemberExpression = __BROWSER__
  ? isMemberExpressionBrowser
  : isMemberExpressionNode

// 复制模版某一范围内的内容，改变其光标位置，当不会改变pos参数，并返回结果
export function advancePositionWithClone(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length, // 移动距离
): Position {
  return advancePositionWithMutation(
    {
      offset: pos.offset,
      line: pos.line,
      column: pos.column,
    },
    source,
    numberOfCharacters,
  )
}

// 改变解析光标位置，会改变 pos 参数，并返回结果
// advance by mutation without cloning (for performance reasons), since this
// gets called a lot in the parser
export function advancePositionWithMutation(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length,
): Position {
  let linesCount = 0
  let lastNewLinePos = -1

  // 识别换行，换行的ascii码：10，空格的ascii码 32
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++
      lastNewLinePos = i
    }
  }

  pos.offset += numberOfCharacters // 光标位置 相对于 模板整体内容长度
  pos.line += linesCount // 通过换行码来判断行数

  pos.column =
    lastNewLinePos === -1 // 即没有换行: <div id='app'><span>没有换行</span></div>
      ? pos.column + numberOfCharacters
      : numberOfCharacters - lastNewLinePos // 将光标定位到当前行后，再定位所要操作的列位置即所对应的字符

  return pos
}

export function assert(condition: boolean, msg?: string) {
  /* istanbul ignore if */
  if (!condition) {
    throw new Error(msg || `unexpected compiler condition`)
  }
}

// 查找指令属性节点
// 如 <hello-world v-is="Welcome" />
export function findDir(
  node: ElementNode,
  name: string | RegExp, // 指令名
  allowEmpty: boolean = false, //  指令属性值是否可以为空
): DirectiveNode | undefined {
  // 在元素节点的属性列表中
  for (let i = 0; i < node.props.length; i++) {
    // 处理指令属性节点
    const p = node.props[i] // 元素属性
    if (
      p.type === NodeTypes.DIRECTIVE && // 属性类别为：指令
      (allowEmpty || p.exp) && // 指令属性值是否可以为空
      (isString(name) ? p.name === name : name.test(p.name)) // 匹配指令名
    ) {
      return p
    }
  }
}

// 查找属性节点：静态属性、静态bind属性，
// 如 <component is="HelloWorld" />
// 或 <component :is="HelloWorld" />
export function findProp(
  node: ElementNode,
  name: string, // 静态dom属性名 或 bind的某个指令名
  dynamicOnly: boolean = false, // 动态属性，如指令属性
  allowEmpty: boolean = false, // 是否属性值为空
): ElementNode['props'][0] | undefined {
  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i]
    if (p.type === NodeTypes.ATTRIBUTE) {
      // dom节点标签静态属性，如 'is'；DIRECTIVE 为指令属性，如 ':is'
      if (dynamicOnly) continue
      if (p.name === name && (p.value || allowEmpty)) {
        return p
      }
    } else if (
      p.name === 'bind' && // v-bind 指令属性，如 ':is'
      (p.exp || allowEmpty) && // p.exp 为指令值节点
      isStaticArgOf(p.arg, name) // 是否静态bind某个指令， p.arg 为指令名表达式节点，如 ':is' 指令中的 'is' 字符串表达式信息节点
    ) {
      return p
    }
  }
}

// 静态bind某个指令，如 ':is' 绑定了is指令
export function isStaticArgOf(
  arg: DirectiveNode['arg'],
  name: string,
): boolean {
  return !!(arg && isStaticExp(arg) && arg.content === name)
}

export function hasDynamicKeyVBind(node: ElementNode): boolean {
  return node.props.some(
    p =>
      p.type === NodeTypes.DIRECTIVE &&
      p.name === 'bind' &&
      (!p.arg || // v-bind="obj"
        p.arg.type !== NodeTypes.SIMPLE_EXPRESSION || // v-bind:[_ctx.foo]
        !p.arg.isStatic), // v-bind:[foo]
  )
}

// 判断是否是 文本节点 或 插值节点
export function isText(
  node: TemplateChildNode,
): node is TextNode | InterpolationNode {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

export function isVSlot(p: ElementNode['props'][0]): p is DirectiveNode {
  return p.type === NodeTypes.DIRECTIVE && p.name === 'slot'
}

export function isTemplateNode(
  node: RootNode | TemplateChildNode,
): node is TemplateNode {
  return (
    node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE
  )
}

// slot 组件
// <slot></slot>
export function isSlotOutlet(
  node: RootNode | TemplateChildNode,
): node is SlotOutletNode {
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT
}

const propsHelperSet = new Set([NORMALIZE_PROPS, GUARD_REACTIVE_PROPS])

function getUnnormalizedProps(
  props: PropsExpression | '{}',
  callPath: CallExpression[] = [],
): [PropsExpression | '{}', CallExpression[]] {
  if (
    props &&
    !isString(props) &&
    props.type === NodeTypes.JS_CALL_EXPRESSION
  ) {
    const callee = props.callee
    if (!isString(callee) && propsHelperSet.has(callee)) {
      return getUnnormalizedProps(
        props.arguments[0] as PropsExpression,
        callPath.concat(props),
      )
    }
  }
  return [props, callPath]
}
export function injectProp(
  node: VNodeCall | RenderSlotCall, // 如 slotOutlet.codegenNode as RenderSlotCall，一个 NodeTypes.JS_CALL_EXPRESSION类型节点
  prop: Property, // 如 <span v-for="..." key="..."></span> 中 key属性对应的js节点
  context: TransformContext,
) {
  let propsWithInjection: ObjectExpression | CallExpression | undefined
  /**
   * 1. mergeProps(...)
   * 2. toHandlers(...)
   * 3. normalizeProps(...)
   * 4. normalizeProps(guardReactiveProps(...))
   *
   * we need to get the real props before normalization
   */
  // slot 的属性列表 transformElement buildProps()，或 子节点列表 props = createFunctionExpression([], slot.children, false, false, loc)
  let props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2] // node.arguments： slotArgs, [2] 保存slot元素的子节点列表
  let callPath: CallExpression[] = []
  let parentCall: CallExpression | undefined

  // 如 <template v-for="(item, index) in items" :key="index"><slot name="header"></slot></template>
  // slot 存在name以外的属性，此时 props = slotProps；
  // 在 transformSlotOutlet.ts 处理 slot元素
  if (
    props &&
    !isString(props) &&
    props.type === NodeTypes.JS_CALL_EXPRESSION
  ) {
    const ret = getUnnormalizedProps(props)
    props = ret[0]
    callPath = ret[1]
    parentCall = callPath[callPath.length - 1]
  }

  if (props == null || isString(props)) {
    // slot标签元素除name属性外，不存在其它属性

    // 如果不存在属性列表，不存在子节点列表： <template v-for="(item, index) in items" :key="index"><slot name="header"></slot></template>
    // 此时 props = undefined

    // 如果不存在属性列表，但存在子节点列表，如 <template v-for="(item, index) in items" :key="index"><slot name="header"><span></span></slot></template>
    // 此时 props = '{}'

    propsWithInjection = createObjectExpression([prop]) // v-for key 属性节点
  } else if (props.type === NodeTypes.JS_CALL_EXPRESSION) {
    // 有 v-bind/v-on(无参数)属性时：
    // 将key 属性加到合并处理后的slot prop属性列表中

    // 处理合并属性，针对 v-on/v-bind(无参数)
    // 如 <template v-for="(item, index) in items" :key="index"><slot name="header" class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></slot></template>
    // 此时 props: createCallExpression(
    //         context.helper(MERGE_PROPS),
    //         mergeArgs, // 即 arguments 合并的属性列表，[class, "{ class: 'yellow'}"]
    //         elementLoc
    //       )
    //  props.arguments 已经处理合并过的slot属性列表，[class合并节点, "{ class: 'yellow'}"]

    // merged props... add ours
    // only inject key to object literal if it's the first argument so that
    // if doesn't override user provided keys
    const first = props.arguments[0] as string | JSChildNode

    if (!isString(first) && first.type === NodeTypes.JS_OBJECT_EXPRESSION) {
      // 针对 v-bind/v-on 在属性列表之后

      // 如 <template v-for="(item, index) in items" :key="index"><slot name="header" class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></slot></template>
      // 在 transformElement 中buildProps会处理属性的合并，在分析 v-bind/v-on（无参数）阶段
      // 此时 first 表示合并后的class属性节点

      // #6631
      if (!hasProp(prop, first)) {
        // 将 v-for key 属性加到前边
        first.properties.unshift(prop)
      }
    } else {
      if (props.callee === TO_HANDLERS) {
        // mergeArgs 第一个是 v-on 指令
        // 如 <template v-for="(item, index) in items" :key="index"><slot name="header" v-on="{click: 'handleClick'}" class="red"></slot></template>

        // #2366
        propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
          createObjectExpression([prop]),
          props,
        ])
      } else {
        // mergeArgs 第一个是 v-bind 指令表达式节点，后面需要其它属性，如class
        // 此时 first 是 v-bind 指令值表达式属性节点
        // 如 <template v-for="(item, index) in items" :key="index"><slot name="header" v-bind="[{class: 'blue'}]" class="red"></slot></template>
        // first.content = "[{class: 'blue'}]"
        props.arguments.unshift(createObjectExpression([prop]))
      }
    }
    !propsWithInjection && (propsWithInjection = props)
  } else if (props.type === NodeTypes.JS_OBJECT_EXPRESSION) {
    // 没有v-bind/v-on(无参数)指令，如：<template v-for="(item, index) in items" :key="index"><slot name="header" data-txt="hello world"></slot></template>
    // 普通属性节点
    if (!hasProp(prop, props)) {
      // 添加到props列表
      props.properties.unshift(prop)
    }
    propsWithInjection = props
  } else {
    // 只有一个 v-bind 属性：<template v-for="(item, index) in items" :key="index"><slot name="header" v-bind="[{class: 'blue'}]"></slot></template>
    // single v-bind with expression, return a merged replacement
    propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
      createObjectExpression([prop]),
      props,
    ])
    // in the case of nested helper call, e.g. `normalizeProps(guardReactiveProps(props))`,
    // it will be rewritten as `normalizeProps(mergeProps({ key: 0 }, props))`,
    // the `guardReactiveProps` will no longer be needed
    if (parentCall && parentCall.callee === GUARD_REACTIVE_PROPS) {
      parentCall = callPath[callPath.length - 2]
    }
  }

  if (node.type === NodeTypes.VNODE_CALL) {
    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection
    } else {
      node.props = propsWithInjection
    }
  } else {
    // 如处理 v-for template slot 元素，将template上的key属性加到 slot元素的属性列表中

    if (parentCall) {
      parentCall.arguments[0] = propsWithInjection
    } else {
      node.arguments[2] = propsWithInjection
    }
  }
}

// check existing key to avoid overriding user provided keys
function hasProp(prop: Property, props: ObjectExpression) {
  let result = false
  if (prop.key.type === NodeTypes.SIMPLE_EXPRESSION) {
    const propKeyName = prop.key.content
    result = props.properties.some(
      p =>
        p.key.type === NodeTypes.SIMPLE_EXPRESSION &&
        p.key.content === propKeyName,
    )
  }
  return result
}

export function toValidAssetId(
  name: string,
  type: 'component' | 'directive' | 'filter',
): string {
  // 非[A-Za-z0-9_]， 如 tag name = 'hello-world' 转换为 '_component_hello__world'
  // see issue#4422, we need adding identifier on validAssetId if variable `name` has specific character
  return `_${type}_${name.replace(/[^\w]/g, (searchValue, replaceValue) => {
    return searchValue === '-' ? '_' : name.charCodeAt(replaceValue).toString()
  })}`
}

// Check if a node contains expressions that reference current context scope ids
export function hasScopeRef(
  node: TemplateChildNode | IfBranchNode | ExpressionNode | undefined,
  ids: TransformContext['identifiers'],
): boolean {
  if (!node || Object.keys(ids).length === 0) {
    return false
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
      for (let i = 0; i < node.props.length; i++) {
        const p = node.props[i]
        if (
          p.type === NodeTypes.DIRECTIVE &&
          (hasScopeRef(p.arg, ids) || hasScopeRef(p.exp, ids))
        ) {
          return true
        }
      }
      return node.children.some(c => hasScopeRef(c, ids))
    case NodeTypes.FOR:
      if (hasScopeRef(node.source, ids)) {
        return true
      }
      return node.children.some(c => hasScopeRef(c, ids))
    case NodeTypes.IF:
      return node.branches.some(b => hasScopeRef(b, ids))
    case NodeTypes.IF_BRANCH:
      if (hasScopeRef(node.condition, ids)) {
        return true
      }
      return node.children.some(c => hasScopeRef(c, ids))
    case NodeTypes.SIMPLE_EXPRESSION:
      return (
        !node.isStatic &&
        isSimpleIdentifier(node.content) &&
        !!ids[node.content]
      )
    case NodeTypes.COMPOUND_EXPRESSION:
      return node.children.some(c => isObject(c) && hasScopeRef(c, ids))
    case NodeTypes.INTERPOLATION:
    case NodeTypes.TEXT_CALL:
      return hasScopeRef(node.content, ids)
    case NodeTypes.TEXT:
    case NodeTypes.COMMENT:
      return false
    default:
      if (__DEV__) {
        const exhaustiveCheck: never = node
        exhaustiveCheck
      }
      return false
  }
}

export function getMemoedVNodeCall(node: BlockCodegenNode | MemoExpression) {
  if (node.type === NodeTypes.JS_CALL_EXPRESSION && node.callee === WITH_MEMO) {
    return node.arguments[1].returns as VNodeCall
  } else {
    return node
  }
}

export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+(\S[\s\S]*)/
