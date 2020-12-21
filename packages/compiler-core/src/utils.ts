import {
  SourceLocation,
  Position,
  ElementNode,
  NodeTypes,
  CallExpression,
  createCallExpression,
  DirectiveNode,
  ElementTypes,
  TemplateChildNode,
  RootNode,
  ObjectExpression,
  Property,
  JSChildNode,
  createObjectExpression,
  SlotOutletNode,
  TemplateNode,
  RenderSlotCall,
  ExpressionNode,
  IfBranchNode,
  TextNode,
  InterpolationNode,
  VNodeCall,
  SimpleExpressionNode
} from './ast'
import { TransformContext } from './transform'
import {
  MERGE_PROPS,
  TELEPORT,
  SUSPENSE,
  KEEP_ALIVE,
  BASE_TRANSITION,
  TO_HANDLERS
} from './runtimeHelpers'
import { isString, isObject, hyphenate, extend } from '@vue/shared'

// 判断一个指令属性节点是否是静态指令;  (动态指令：':[dynamicName]="value"')
export const isStaticExp = (p: JSChildNode): p is SimpleExpressionNode =>
  // 指令名节点表达式，如 template: <component :is='HelloWold' />， 静态is返回true
  p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic

export const isBuiltInType = (tag: string, expected: string): boolean =>
  tag === expected || tag === hyphenate(expected) // 匹配非单词边界的第一个大写字母，在其前边加上 - , 并小写后面所有，如 'MyComponentABc' 结果为： 'my-componentabc'

export function isCoreComponent(tag: string): symbol | void {
  if (isBuiltInType(tag, 'Teleport')) {
    return TELEPORT
  } else if (isBuiltInType(tag, 'Suspense')) {
    return SUSPENSE
  } else if (isBuiltInType(tag, 'KeepAlive')) {
    // tag： 'KeepAlive' 或 'keep-alive'
    return KEEP_ALIVE // Symbol(__DEV__ ? `KeepAlive` : ``)
  } else if (isBuiltInType(tag, 'BaseTransition')) {
    return BASE_TRANSITION
  }
}

// 数字开头：'123abc$'
// 或不能只有： $、字母、数字、下划线，比如 '{foo:true}'
const nonIdentifierRE = /^\d|[^\$\w]/
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
const memberExpRE = /^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*|\[[^\]]+\])*$/
export const isMemberExpression = (path: string): boolean => {
  if (!path) return false
  return memberExpRE.test(path.trim())
}

export function getInnerRange(
  loc: SourceLocation,
  offset: number,
  length?: number
): SourceLocation {
  __TEST__ && assert(offset <= loc.source.length)
  const source = loc.source.substr(offset, length)
  const newLoc: SourceLocation = {
    source,
    start: advancePositionWithClone(loc.start, loc.source, offset), // 移动offset距离
    end: loc.end
  }

  if (length != null) {
    __TEST__ && assert(offset + length <= loc.source.length)
    newLoc.end = advancePositionWithClone(
      loc.start,
      loc.source,
      offset + length
    )
  }

  return newLoc
}

// 复制模版某一范围内的内容，改变其光标位置，当不会改变pos参数，并返回结果
export function advancePositionWithClone(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length // 移动距离
): Position {
  return advancePositionWithMutation(
    extend({}, pos),
    source,
    numberOfCharacters
  )
}

// 改变解析光标位置，会改变 pos 参数，并返回结果
// advance by mutation without cloning (for performance reasons), since this
// gets called a lot in the parser
export function advancePositionWithMutation(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length
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
export function findDir(
  node: ElementNode,
  name: string | RegExp, // 指令名
  allowEmpty: boolean = false //  指令属性值是否可以为空
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

// 查找属性节点：静态属性、静态bind属性
export function findProp(
  node: ElementNode,
  name: string, // 静态dom属性名 或 bind的某个指令名
  dynamicOnly: boolean = false, // 动态属性，如指令属性
  allowEmpty: boolean = false // 是否属性值为空
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
      isBindKey(p.arg, name) // 是否静态bind某个指令， p.arg 为指令名表达式节点，如 ':is' 指令中的 'is' 字符串表达式信息节点
    ) {
      return p
    }
  }
}

// 静态bind某个指令，如 ':is' 绑定了is指令
export function isBindKey(arg: DirectiveNode['arg'], name: string): boolean {
  return !!(arg && isStaticExp(arg) && arg.content === name)
}

export function hasDynamicKeyVBind(node: ElementNode): boolean {
  return node.props.some(
    p =>
      p.type === NodeTypes.DIRECTIVE &&
      p.name === 'bind' &&
      (!p.arg || // v-bind="obj"
      p.arg.type !== NodeTypes.SIMPLE_EXPRESSION || // v-bind:[_ctx.foo]
        !p.arg.isStatic) // v-bind:[foo]
  )
}

// 判断是否是 文本节点 或 插值节点
export function isText(
  node: TemplateChildNode
): node is TextNode | InterpolationNode {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}

export function isVSlot(p: ElementNode['props'][0]): p is DirectiveNode {
  return p.type === NodeTypes.DIRECTIVE && p.name === 'slot'
}

export function isTemplateNode(
  node: RootNode | TemplateChildNode
): node is TemplateNode {
  return (
    node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.TEMPLATE
  )
}

// slot 组件
export function isSlotOutlet(
  node: RootNode | TemplateChildNode
): node is SlotOutletNode {
  return node.type === NodeTypes.ELEMENT && node.tagType === ElementTypes.SLOT
}

export function injectProp(
  node: VNodeCall | RenderSlotCall,
  prop: Property,
  context: TransformContext
) {
  let propsWithInjection: ObjectExpression | CallExpression | undefined
  const props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]
  if (props == null || isString(props)) {
    propsWithInjection = createObjectExpression([prop])
  } else if (props.type === NodeTypes.JS_CALL_EXPRESSION) {
    // merged props... add ours
    // only inject key to object literal if it's the first argument so that
    // if doesn't override user provided keys
    const first = props.arguments[0] as string | JSChildNode
    if (!isString(first) && first.type === NodeTypes.JS_OBJECT_EXPRESSION) {
      first.properties.unshift(prop)
    } else {
      if (props.callee === TO_HANDLERS) {
        // #2366
        propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
          createObjectExpression([prop]),
          props
        ])
      } else {
        props.arguments.unshift(createObjectExpression([prop]))
      }
    }
    !propsWithInjection && (propsWithInjection = props)
  } else if (props.type === NodeTypes.JS_OBJECT_EXPRESSION) {
    let alreadyExists = false
    // check existing key to avoid overriding user provided keys
    if (prop.key.type === NodeTypes.SIMPLE_EXPRESSION) {
      const propKeyName = prop.key.content
      alreadyExists = props.properties.some(
        p =>
          p.key.type === NodeTypes.SIMPLE_EXPRESSION &&
          p.key.content === propKeyName
      )
    }
    if (!alreadyExists) {
      props.properties.unshift(prop)
    }
    propsWithInjection = props
  } else {
    // single v-bind with expression, return a merged replacement
    propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
      createObjectExpression([prop]),
      props
    ])
  }
  if (node.type === NodeTypes.VNODE_CALL) {
    node.props = propsWithInjection
  } else {
    node.arguments[2] = propsWithInjection
  }
}

export function toValidAssetId(
  name: string,
  type: 'component' | 'directive'
): string {
  return `_${type}_${name.replace(/[^\w]/g, '_')}` // 非[A-Za-z0-9_]， 如 name = 'hello  world' 转换为 '_component_hello__world'
}

// Check if a node contains expressions that reference current context scope ids
export function hasScopeRef(
  node: TemplateChildNode | IfBranchNode | ExpressionNode | undefined,
  ids: TransformContext['identifiers']
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
