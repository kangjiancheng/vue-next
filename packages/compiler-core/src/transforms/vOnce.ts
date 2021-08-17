import { NodeTransform } from '../transform'
import { findDir } from '../utils'
import { ElementNode, ForNode, IfNode, NodeTypes } from '../ast'
import { SET_BLOCK_TRACKING } from '../runtimeHelpers'

// 弱集合，
const seen = new WeakSet()

// 编译一次节点，不进行再次编译，缓存codegenNode
export const transformOnce: NodeTransform = (node, context) => {
  if (node.type === NodeTypes.ELEMENT && findDir(node, 'once', true)) {
    // 判断节点是否存在v-once指令属性
    if (seen.has(node) || context.inVOnce) {
      // 记录已处理的节点，只处理一次节点，即如果下一次在触发重新编译时，不用管该节点。
      return
    }
    seen.add(node)
    context.inVOnce = true
    context.helper(SET_BLOCK_TRACKING) // 添加到 context.helpers set() 集合中，标记处于跟踪处理中
    return () => {
      context.inVOnce = false
      const cur = context.currentNode as ElementNode | IfNode | ForNode
      if (cur.codegenNode) {
        // 并设置缓存
        cur.codegenNode = context.cache(cur.codegenNode, true /* isVNode */)
      }
    }
  }
}
