import { NodeTransform, NodeTypes, ElementTypes } from '@vue/compiler-core'
import { DOMErrorCodes, createDOMCompilerError } from '../errors'

// 移除模版中 script 与 style 标签节点
export const ignoreSideEffectTags: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ELEMENT &&
    node.tagType === ElementTypes.ELEMENT &&
    (node.tag === 'script' || node.tag === 'style')
  ) {
    context.onError(
      createDOMCompilerError(DOMErrorCodes.X_IGNORED_SIDE_EFFECT_TAG, node.loc)
    )
    // 移除 script 与 style 标签节点
    context.removeNode()
  }
}
