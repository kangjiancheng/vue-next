import {
  DirectiveTransform,
  createObjectProperty,
  createSimpleExpression
} from '@vue/compiler-core'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'

// 解析 v-html指令，属性值必须存在，覆盖子内容
export const transformVHtml: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_NO_EXPRESSION, loc)
    )
  }
  if (node.children.length) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_HTML_WITH_CHILDREN, loc)
    )
    node.children.length = 0
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`innerHTML`, true, loc),
        exp || createSimpleExpression('', true)
      )
    ]
  }
}
