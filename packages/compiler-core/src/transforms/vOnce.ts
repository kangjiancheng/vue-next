import { NodeTransform } from '../transform'
import { findDir } from '../utils'
import { ElementNode, ForNode, IfNode, NodeTypes } from '../ast'
import { SET_BLOCK_TRACKING } from '../runtimeHelpers'

// 弱集合
const seen = new WeakSet()

export const transformOnce: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT && findDir(node, 'once', true)) {
    // 判断节点是否存在v-once指令属性
    if (seen.has(node)) {
      // 记录已处理的节点
      return
    }
    seen.add(node)

    // 添加到 context.helpers set() 集合中，标记处于跟踪处理中
    context.helper(SET_BLOCK_TRACKING)
    return () => {
      const cur = context.currentNode as ElementNode | IfNode | ForNode // 父节点
      if (cur.codegenNode) {
        cur.codegenNode = context.cache(cur.codegenNode, true /* isVNode */)
      }
    }
  }
}
