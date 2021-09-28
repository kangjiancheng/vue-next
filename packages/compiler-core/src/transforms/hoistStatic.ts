import {
  ConstantTypes,
  RootNode,
  NodeTypes,
  TemplateChildNode,
  SimpleExpressionNode,
  ElementTypes,
  PlainElementNode,
  ComponentNode,
  TemplateNode,
  VNodeCall,
  ParentNode,
  JSChildNode,
  CallExpression,
  createArrayExpression
} from '../ast'
import { TransformContext } from '../transform'
import { PatchFlags, isString, isSymbol, isArray } from '@vue/shared'
import { getVNodeBlockHelper, getVNodeHelper, isSlotOutlet } from '../utils'
import {
  OPEN_BLOCK,
  GUARD_REACTIVE_PROPS,
  NORMALIZE_CLASS,
  NORMALIZE_PROPS,
  NORMALIZE_STYLE
} from '../runtimeHelpers'

// 静态提升：节点属性列表、节点子元素
// ConstantTypes {
//   NOT_CONSTANT = 0,  // 静态属性
//   CAN_SKIP_PATCH,
//   CAN_HOIST,         // 静态节点/文本
//   CAN_STRINGIFY      // 静态节点/文本
// }
export function hoistStatic(root: RootNode, context: TransformContext) {
  walk(
    root, // ast 根节点
    context,
    // Root node is unfortunately non-hoistable due to potential parent
    // fallthrough attributes.
    isSingleElementRoot(root, root.children[0]) // vue模版只有一个根标签元素：true
  )
}

// ast 根节点下只有一个节点，即template内容只有一个元素
// 只有一个元素， template: '<div>...</div>'
export function isSingleElementRoot(
  root: RootNode, // ast 根节点
  child: TemplateChildNode // ast 根节点 的第一个节点
): child is PlainElementNode | ComponentNode | TemplateNode {
  const { children } = root
  return (
    children.length === 1 &&
    child.type === NodeTypes.ELEMENT && // 标签元素
    !isSlotOutlet(child) // 不是 <slot></slot>
  )
}

// 递归节点子元素，对节点的子元素进行静态标记并创建静态节点
function walk(
  node: ParentNode,
  context: TransformContext,
  doNotHoistNode: boolean = false
) {
  // Some transforms, e.g. transformAssetUrls from @vue/compiler-sfc, replaces
  // static bindings with expressions. These expressions are guaranteed to be
  // constant so they are still eligible for hoisting, but they are only
  // available at runtime and therefore cannot be evaluated ahead of time.
  // This is only a concern for pre-stringification (via transformHoist by
  // @vue/compiler-dom), but doing it here allows us to perform only one full
  // walk of the AST and allow `stringifyStatic` to stop walking as soon as its
  // stringficiation threshold is met.
  let canStringify = true // NOT_CONSTANT、CAN_STRINGIFY、

  // ConstantTypes {
  //   NOT_CONSTANT = 0,
  //   CAN_SKIP_PATCH,
  //   CAN_HOIST,
  //   CAN_STRINGIFY
  // }

  const { children } = node // ast子节点列表
  const originalCount = children.length
  let hoistedCount = 0

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    // only plain elements & text calls are eligible for hoisting.
    // 普通元素节点和文本节点是符合静态提升
    if (
      child.type === NodeTypes.ELEMENT && // ELEMENT、FOR、IF_BRANCH、IF
      child.tagType === ElementTypes.ELEMENT // ELEMENT、 COMPONENT、 SLOT、 TEMPLATE
    ) {
      // 普通dom节点（没有vue语法），需要静态提升

      const constantType = doNotHoistNode
        ? ConstantTypes.NOT_CONSTANT // vue 模版 单根标签元素节点
        : getConstantType(child, context)

      // ConstantTypes {
      //   NOT_CONSTANT = 0,  // 静态属性
      //   CAN_SKIP_PATCH,    // 静态节点
      //   CAN_HOIST,         // 静态节点
      //   CAN_STRINGIFY      // 静态节点
      // }
      if (constantType > ConstantTypes.NOT_CONSTANT) {
        // 静态提升节点: CAN_SKIP_PATCH、CAN_HOIST、CAN_STRINGIFY

        if (constantType < ConstantTypes.CAN_STRINGIFY) {
          // ConstantTypes = CAN_SKIP_PATCH、CAN_HOIST
          canStringify = false
        }
        if (constantType >= ConstantTypes.CAN_HOIST) {
          // ConstantTypes = CAN_HOIST、CAN_STRINGIFY

          ;(child.codegenNode as VNodeCall).patchFlag =
            PatchFlags.HOISTED + (__DEV__ ? ` /* HOISTED */` : ``) //  -1

          // 创建静态节点与变量名
          child.codegenNode = context.hoist(child.codegenNode!)
          hoistedCount++
          continue
        }
      } else {
        // 静态提升节点属性 NOT_CONSTANT

        // node may contain dynamic children, but its props may be eligible for
        // hoisting.

        const codegenNode = child.codegenNode!
        if (codegenNode.type === NodeTypes.VNODE_CALL) {
          const flag = getPatchFlag(codegenNode)
          if (
            (!flag ||
              flag === PatchFlags.NEED_PATCH ||
              flag === PatchFlags.TEXT) &&
            getGeneratedPropsConstantType(child, context) >=
              ConstantTypes.CAN_HOIST
          ) {
            // CAN_HOIST、CAN_STRINGIFY

            const props = getNodeProps(child)
            if (props) {
              // 设置 提升静态节点属性
              codegenNode.props = context.hoist(props)
            }
          }
          if (codegenNode.dynamicProps) {
            codegenNode.dynamicProps = context.hoist(codegenNode.dynamicProps)
          }
        }
      }
    } else if (child.type === NodeTypes.TEXT_CALL) {
      // 提升静态文本节点（纯文本，不存在插值之类）
      //
      // TEXT_CALL - 不纯的子节点：（处理其中的文本合并）
      // 1、即有文本又有其它， 如 template: '{{ foo }} - {{ bar }} <span>123</span>'
      // 2、当前为非 根节点/dom标签元素节点，且存在子文本节点，如 template: '<component-demo>123</component-demo>

      const contentType = getConstantType(child.content, context)

      if (contentType > 0) {
        // CAN_SKIP_PATCH、CAN_HOIST、CAN_STRINGIFY

        if (contentType < ConstantTypes.CAN_STRINGIFY) {
          // ConstantTypes = CAN_SKIP_PATCH、CAN_HOIST

          canStringify = false
        }

        if (contentType >= ConstantTypes.CAN_HOIST) {
          // ConstantTypes = CAN_HOIST、CAN_STRINGIFY

          // 如 <div><i :class="red">1</i>abc</div>，静态提升其中文本节点 'abc'
          child.codegenNode = context.hoist(child.codegenNode)
          hoistedCount++
        }
      }
    }

    // 递归设置
    // walk further
    if (child.type === NodeTypes.ELEMENT) {
      // 标签元素
      const isComponent = child.tagType === ElementTypes.COMPONENT
      if (isComponent) {
        context.scopes.vSlot++
      }

      walk(child, context)

      if (isComponent) {
        context.scopes.vSlot--
      }
    } else if (child.type === NodeTypes.FOR) {
      // for节点，对于只有一个for子节点，不需要hoist
      // Do not hoist v-for single child because it has to be a block
      walk(child, context, child.children.length === 1)
    } else if (child.type === NodeTypes.IF) {
      // if分支流节点
      for (let i = 0; i < child.branches.length; i++) {
        // 分析其中的if、else-if、else节点

        // Do not hoist v-if single child because it has to be a block
        walk(
          child.branches[i], // if、else-if、else节点
          context,
          child.branches[i].children.length === 1 // 当前分支节点下的子元素数量
        )
      }
    }
  }

  // ConstantTypes = CAN_STRINGIFY
  // 如，template: '<div>123</div><div>abc</div>'
  if (canStringify && hoistedCount && context.transformHoist) {
    // transformHoist: __BROWSER__ ? null : stringifyStatic
    context.transformHoist(children, context, node)
  }

  // all children were hoisted - the entire children array is hoistable.
  if (
    hoistedCount &&
    hoistedCount === originalCount &&
    node.type === NodeTypes.ELEMENT &&
    node.tagType === ElementTypes.ELEMENT &&
    node.codegenNode &&
    node.codegenNode.type === NodeTypes.VNODE_CALL &&
    isArray(node.codegenNode.children)
  ) {
    node.codegenNode.children = context.hoist(
      createArrayExpression(node.codegenNode.children)
    )
  }
}

export function getConstantType(
  node: TemplateChildNode | SimpleExpressionNode,
  context: TransformContext
): ConstantTypes {
  const { constantCache } = context
  switch (node.type) {
    case NodeTypes.ELEMENT:
      if (node.tagType !== ElementTypes.ELEMENT) {
        return ConstantTypes.NOT_CONSTANT
      }
      const cached = constantCache.get(node)
      if (cached !== undefined) {
        return cached
      }
      const codegenNode = node.codegenNode!
      if (codegenNode.type !== NodeTypes.VNODE_CALL) {
        return ConstantTypes.NOT_CONSTANT
      }
      const flag = getPatchFlag(codegenNode)
      if (!flag) {
        let returnType = ConstantTypes.CAN_STRINGIFY

        // Element itself has no patch flag. However we still need to check:

        // 1. Even for a node with no patch flag, it is possible for it to contain
        // non-hoistable expressions that refers to scope variables, e.g. compiler
        // injected keys or cached event handlers. Therefore we need to always
        // check the codegenNode's props to be sure.
        const generatedPropsType = getGeneratedPropsConstantType(node, context)
        if (generatedPropsType === ConstantTypes.NOT_CONSTANT) {
          constantCache.set(node, ConstantTypes.NOT_CONSTANT)
          return ConstantTypes.NOT_CONSTANT
        }
        if (generatedPropsType < returnType) {
          returnType = generatedPropsType
        }

        // 2. its children.
        for (let i = 0; i < node.children.length; i++) {
          const childType = getConstantType(node.children[i], context)
          if (childType === ConstantTypes.NOT_CONSTANT) {
            constantCache.set(node, ConstantTypes.NOT_CONSTANT)
            return ConstantTypes.NOT_CONSTANT
          }
          if (childType < returnType) {
            returnType = childType
          }
        }

        // 3. if the type is not already CAN_SKIP_PATCH which is the lowest non-0
        // type, check if any of the props can cause the type to be lowered
        // we can skip can_patch because it's guaranteed by the absence of a
        // patchFlag.
        if (returnType > ConstantTypes.CAN_SKIP_PATCH) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i]
            if (p.type === NodeTypes.DIRECTIVE && p.name === 'bind' && p.exp) {
              const expType = getConstantType(p.exp, context)
              if (expType === ConstantTypes.NOT_CONSTANT) {
                constantCache.set(node, ConstantTypes.NOT_CONSTANT)
                return ConstantTypes.NOT_CONSTANT
              }
              if (expType < returnType) {
                returnType = expType
              }
            }
          }
        }

        // only svg/foreignObject could be block here, however if they are
        // static then they don't need to be blocks since there will be no
        // nested updates.
        if (codegenNode.isBlock) {
          context.removeHelper(OPEN_BLOCK)
          context.removeHelper(
            getVNodeBlockHelper(context.inSSR, codegenNode.isComponent)
          )
          codegenNode.isBlock = false
          context.helper(getVNodeHelper(context.inSSR, codegenNode.isComponent))
        }

        constantCache.set(node, returnType)
        return returnType
      } else {
        constantCache.set(node, ConstantTypes.NOT_CONSTANT)
        return ConstantTypes.NOT_CONSTANT
      }
    case NodeTypes.TEXT:
    case NodeTypes.COMMENT:
      return ConstantTypes.CAN_STRINGIFY
    case NodeTypes.IF:
    case NodeTypes.FOR:
    case NodeTypes.IF_BRANCH:
      return ConstantTypes.NOT_CONSTANT
    case NodeTypes.INTERPOLATION: // 如果是插值节点，需要处理的是插值的内容节点
    case NodeTypes.TEXT_CALL:
      return getConstantType(node.content, context)
    case NodeTypes.SIMPLE_EXPRESSION: // 如，插值节点（由插值内容节点控制）
      return node.constType

    case NodeTypes.COMPOUND_EXPRESSION: // 合并后的包含连续子文本节点
      let returnType = ConstantTypes.CAN_STRINGIFY

      // 处理连续子文本节点列表中的每一个子节点
      // 如：template: '{{ foo }}   {{ bar }} <span>123</span>'，当前node为： '{{ foo }}   {{ bar }} '，其子节点为合并后的连续子节点列表，即node.children : [{foo...}, ' + ', {' '...}, ' + ', {bar...}, ' + ', {' '...}]

      // 或v-on指令属性值内容，children: ['$event => {', exp, '}']

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]
        if (isString(child) || isSymbol(child)) {
          // 跳过分隔元素，如加号 ' + '
          continue
        }
        // 通过子元素类型 判断当前元素联合元素类型
        const childType = getConstantType(child, context)
        if (childType === ConstantTypes.NOT_CONSTANT) {
          return ConstantTypes.NOT_CONSTANT // 如：插值文本节点
        } else if (childType < returnType) {
          //   NOT_CONSTANT = 0, 识别优先级高
          //   CAN_SKIP_PATCH = 1,
          //   CAN_HOIST = 2,
          //   CAN_STRINGIFY = 3
          returnType = childType
        }
      }
      return returnType
    default:
      if (__DEV__) {
        const exhaustiveCheck: never = node
        exhaustiveCheck
      }
      // 如 JS_CALL_EXPRESSION
      return ConstantTypes.NOT_CONSTANT
  }
}

const allowHoistedHelperSet = new Set([
  NORMALIZE_CLASS,
  NORMALIZE_STYLE,
  NORMALIZE_PROPS,
  GUARD_REACTIVE_PROPS
])

function getConstantTypeOfHelperCall(
  value: CallExpression,
  context: TransformContext
): ConstantTypes {
  if (
    value.type === NodeTypes.JS_CALL_EXPRESSION &&
    !isString(value.callee) &&
    allowHoistedHelperSet.has(value.callee)
  ) {
    const arg = value.arguments[0] as JSChildNode
    if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
      return getConstantType(arg, context)
    } else if (arg.type === NodeTypes.JS_CALL_EXPRESSION) {
      // in the case of nested helper call, e.g. `normalizeProps(guardReactiveProps(exp))`
      return getConstantTypeOfHelperCall(arg, context)
    }
  }
  return ConstantTypes.NOT_CONSTANT
}

function getGeneratedPropsConstantType(
  node: PlainElementNode,
  context: TransformContext
): ConstantTypes {
  let returnType = ConstantTypes.CAN_STRINGIFY
  const props = getNodeProps(node)
  if (props && props.type === NodeTypes.JS_OBJECT_EXPRESSION) {
    const { properties } = props
    for (let i = 0; i < properties.length; i++) {
      const { key, value } = properties[i]
      const keyType = getConstantType(key, context)
      if (keyType === ConstantTypes.NOT_CONSTANT) {
        return keyType
      }
      if (keyType < returnType) {
        returnType = keyType
      }
      let valueType: ConstantTypes
      if (value.type === NodeTypes.SIMPLE_EXPRESSION) {
        valueType = getConstantType(value, context)
      } else if (value.type === NodeTypes.JS_CALL_EXPRESSION) {
        // some helper calls can be hoisted,
        // such as the `normalizeProps` generated by the compiler for pre-normalize class,
        // in this case we need to respect the ConstantType of the helper's argments
        valueType = getConstantTypeOfHelperCall(value, context)
      } else {
        valueType = ConstantTypes.NOT_CONSTANT
      }
      if (valueType === ConstantTypes.NOT_CONSTANT) {
        return valueType
      }
      if (valueType < returnType) {
        returnType = valueType
      }
    }
  }
  return returnType
}

function getNodeProps(node: PlainElementNode) {
  const codegenNode = node.codegenNode!
  if (codegenNode.type === NodeTypes.VNODE_CALL) {
    return codegenNode.props
  }
}

function getPatchFlag(node: VNodeCall): number | undefined {
  const flag = node.patchFlag
  return flag ? parseInt(flag, 10) : undefined
}
