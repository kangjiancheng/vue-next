import {
  NodeTransform,
  NodeTypes,
  createSimpleExpression,
  SimpleExpressionNode,
  SourceLocation,
  ConstantTypes
} from '@vue/compiler-core'
import { parseStringStyle } from '@vue/shared'

// 将 静态 的行内style样式解析成对应的 动态的style对象格式，如：
// style="color: red" -> :style='{ "color": "red" }'，转换对应的 ast 属性节点为指令属性节点
// 之后通过 `transformElement` 阶段继续后续处理，
// 如果原本就是 :style='{ "color": "red" }'，在处理生成ast的节点props，后续也同样需要经过'transformElement'阶段

// Parse inline CSS strings for static style attributes into an object.
// This is a NodeTransform since it works on the static `style` attribute and
// converts it into a dynamic equivalent:
// style="color: red" -> :style='{ "color": "red" }'
// It is then processed by `transformElement` and included in the generated
// props.
export const transformStyle: NodeTransform = node => {
  if (node.type === NodeTypes.ELEMENT) {
    node.props.forEach((p, i) => {
      if (p.type === NodeTypes.ATTRIBUTE && p.name === 'style' && p.value) {
        // replace p with an expression node
        // 如果是一个静态style属性节点，则转换为对应的动态style指令属性节点
        node.props[i] = {
          type: NodeTypes.DIRECTIVE,
          name: `bind`,
          arg: createSimpleExpression(`style`, true, p.loc), // 创建对应的行内 style 表达式配置对象
          exp: parseInlineCSS(p.value.content, p.loc), // 创建对应的style 表达式配置对象
          modifiers: [],
          loc: p.loc
        }
      }
    })
  }
}

const parseInlineCSS = (
  cssText: string,
  loc: SourceLocation
): SimpleExpressionNode => {
  const normalized = parseStringStyle(cssText) // 转换 为对象表达式格式style
  // 创建对应的style 表达式配置对象
  return createSimpleExpression(
    JSON.stringify(normalized), // style表达式 字符串化
    false, // 动态表达式
    loc, // style 节点信息
    ConstantTypes.CAN_STRINGIFY //
  )
}
