import { NodeTransform, NodeTypes, ElementTypes } from '@vue/compiler-core'
import { DOMErrorCodes, createDOMCompilerError } from '../errors'

// 移除模版中 script 与 style 标签节点
export const ignoreSideEffectTags: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ELEMENT &&
    node.tagType === ElementTypes.ELEMENT &&
    (node.tag === 'script' || node.tag === 'style')
  ) {
    __DEV__ &&
      context.onError(
        // 提示用户不需要有style,script标签，会被忽略
        createDOMCompilerError(
          DOMErrorCodes.X_IGNORED_SIDE_EFFECT_TAG,
          node.loc
        )
      )
    // 移除 script 与 style 标签节点
    context.removeNode()
  }
}
