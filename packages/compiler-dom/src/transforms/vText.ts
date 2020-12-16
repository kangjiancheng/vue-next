import {
  DirectiveTransform,
  createObjectProperty,
  createSimpleExpression,
  TO_DISPLAY_STRING,
  createCallExpression
} from '@vue/compiler-core'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'

// 解析 v-text指令，需要有属性值，覆盖节点子内容
// <span v-text="msg"></span>
// <!-- same as -->
// <span>{{msg}}</span>
export const transformVText: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_TEXT_NO_EXPRESSION, loc)
    )
  }
  if (node.children.length) {
    // 覆盖子内容
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_TEXT_WITH_CHILDREN, loc) //v-text will override element children.
    )
    node.children.length = 0
  }
  return {
    props: [
      createObjectProperty(
        createSimpleExpression(`textContent`, true),
        exp // 存在属性值
          ? createCallExpression(
              context.helperString(TO_DISPLAY_STRING), // Symbol(__DEV__ ? `toDisplayString` : ``)
              [exp],
              loc
            )
          : createSimpleExpression('', true)
      )
    ]
  }
}
