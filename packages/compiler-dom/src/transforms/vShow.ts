import { DirectiveTransform } from '@vue/compiler-core'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'
import { V_SHOW } from '../runtimeHelpers'

// 解析 v-show 指令
export const transformShow: DirectiveTransform = (dir, node, context) => {
  const { exp, loc } = dir
  if (!exp) {
    // 必须设置属性值
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_V_SHOW_NO_EXPRESSION, loc)
    )
  }

  return {
    props: [],
    needRuntime: context.helper(V_SHOW)
  }
}
