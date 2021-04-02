import { NodeTransform, TransformContext } from '../transform'
import {
  NodeTypes,
  CallExpression,
  createCallExpression,
  ExpressionNode,
  SlotOutletNode,
  createFunctionExpression
} from '../ast'
import { isSlotOutlet, isBindKey, isStaticExp } from '../utils'
import { buildProps, PropsExpression } from './transformElement'
import { createCompilerError, ErrorCodes } from '../errors'
import { RENDER_SLOT } from '../runtimeHelpers'
import { camelize } from '@vue/shared/'

// 处理标签slot元素组件：name属性、其它属性prop列表（处理方式buildProps，同transformElements）
export const transformSlotOutlet: NodeTransform = (node, context) => {
  if (isSlotOutlet(node)) {
    // 是否是slot标签的节点
    const { children, loc } = node

    // 解析slot元素的name属性、解析slot元素其它属性 buildProps
    // 如：'<slot name="header" item="hello world" :data-text="'123'"></slot>'
    const { slotName, slotProps } = processSlotOutlet(node, context)

    // codegen 的参数
    const slotArgs: CallExpression['arguments'] = [
      context.prefixIdentifiers ? `_ctx.$slots` : `$slots`,
      slotName
    ]

    // 处理属性列表
    if (slotProps) {
      // 向父组件传递props
      slotArgs.push(slotProps)
    }

    // 处理子节点列表
    if (children.length) {
      if (!slotProps) {
        slotArgs.push(`{}`) // 默认子节点
      }
      slotArgs.push(createFunctionExpression([], children, false, false, loc))
    }

    // 返回codegen代码
    // 如：'<slot name="header" item="hello world" :data-text="'123'"></slot>'
    // _renderSlot($slots, "header", {
    //         item: "hello world",
    //         dataText: '123'
    //       })
    if (context.slotted && !context.slotted) {
      if (!slotProps) {
        slotArgs.push(`{}`)
      }
      if (!children.length) {
        slotArgs.push(`undefined`)
      }
      slotArgs.push(`true`)
    }

    node.codegenNode = createCallExpression(
      context.helper(RENDER_SLOT), // RENDER_SLOT = Symbol(__DEV__ ? `renderSlot` : ``)
      slotArgs,
      loc
    )
  }
}

interface SlotOutletProcessResult {
  slotName: string | ExpressionNode
  slotProps: PropsExpression | undefined
}

// 解析slot元素的name属性、解析slot元素其它属性buildProps
export function processSlotOutlet(
  node: SlotOutletNode,
  context: TransformContext
): SlotOutletProcessResult {
  let slotName: string | ExpressionNode = `"default"` // slot 插槽名 静态/动态：'<slot name="default"></slot>'
  let slotProps: PropsExpression | undefined = undefined // 经解析后的props列表（同transformElement中的元素/组件上prop解析过程）：已处理所有属性包括静态属性、静态/动态指令属性，并进行了合并去重处理

  // 除 静态/动态name属性节点 之外的prop节点列表，如：'<slot name="header" item="hello world" :data-text="'123'"></slot>'
  const nonNameProps = []

  for (let i = 0; i < node.props.length; i++) {
    const p = node.props[i]
    if (p.type === NodeTypes.ATTRIBUTE) {
      // 静态属性
      if (p.value) {
        if (p.name === 'name') {
          // 插槽名，如: '<slot name="default"></slot>'
          slotName = JSON.stringify(p.value.content)
        } else {
          // slot prop 属性列表，传递给组件，如: '<slot name="header" item="hello world"></slot>'
          p.name = camelize(p.name)
          nonNameProps.push(p) // 除name属性之外的prop列表
        }
      }
    } else {
      // 动态属性
      if (p.name === 'bind' && isBindKey(p.arg, 'name')) {
        // 动态 name，如: '<slot :name="slotName"></slot>'
        if (p.exp) slotName = p.exp
      } else {
        // 非name
        if (p.name === 'bind' && p.arg && isStaticExp(p.arg)) {
          // prop参数名转换为小驼峰：camelCase
          // 如 <slot :data-text="'hello-world'"></slot>
          p.arg.content = camelize(p.arg.content)
        }
        nonNameProps.push(p)
      }
    }
  }

  if (nonNameProps.length > 0) {
    // 解析slot节点的 prop属性列表，包括指令属性等
    const { props, directives } = buildProps(node, context, nonNameProps)
    slotProps = props // 解析后的props列表

    if (directives.length) {
      // 不可以添加用户自定义指令
      context.onError(
        createCompilerError(
          ErrorCodes.X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET, // Unexpected custom directive on <slot> outlet.
          directives[0].loc
        )
      )
    }
  }

  return {
    slotName, // slot 名字name
    slotProps // 经解析后的props列表（同transformElement中的prop解析过程）：已处理所有属性包括静态属性、静态/动态指令属性，并进行了合并去重处理
  }
}
