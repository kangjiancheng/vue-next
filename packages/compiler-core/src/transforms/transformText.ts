import { NodeTransform } from '../transform'
import {
  NodeTypes,
  CompoundExpressionNode,
  createCallExpression,
  CallExpression,
  ElementTypes,
  ConstantTypes
} from '../ast'
import { isText } from '../utils'
import { CREATE_TEXT } from '../runtimeHelpers'
import { PatchFlags, PatchFlagNames } from '@vue/shared'
import { getConstantType } from './hoistStatic'

// 合并处理 当前节点的 连续子文本节点/表达式节点，转换为新的 混合子节点，且混合子节点的child存储着原先的连续子文本节点
// Merge adjacent text nodes and expressions into a single expression
// e.g. <div>abc {{ d }} {{ e }}</div> should have a single expression node as child.
export const transformText: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    // 在节点退出时 执行transform，因为此时所以表达式都已经被处理了
    // perform the transform on node exit so that all expressions have already
    // been processed.
    return () => {
      // 合并处理当前节点的子节点
      const children = node.children
      let currentContainer: CompoundExpressionNode | undefined = undefined // 合并的节点
      let hasText = false

      // 合并处理子节点中的连续文本节点，同时移除已合并的子节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i] // 子节点
        if (isText(child)) {
          // 判断子节点是否是 文本节点 或 插值节点
          hasText = true
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]
            if (isText(next)) {
              // 如果下一个也是文本/插值节点
              if (!currentContainer) {
                // 将当前文本节点添加到 合并节点 列表中去，同时修改原ast对应的当前在处理的ast节点的子节点列表
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION, // 合成表达式节点
                  loc: child.loc,
                  children: [child]
                }
              }
              // merge adjacent text node into current
              currentContainer.children.push(` + `, next) // 将下一个文本节点添加到 合并节点 的子节点列表中，注意数组中还加入了一个 '+' 加号元素，currentContainer.children: [{...}, ' + ', {...}, ...]
              children.splice(j, 1) // 合并后，删除原先子节点
              j-- // 删除后，回退原先位置
            } else {
              // 如果下一个不是文本/插值节点，重置状态
              currentContainer = undefined
              break
            }
          }
        }
      }

      if (
        !hasText ||
        // if this is a plain element with a single text child, leave it
        // as-is since the runtime has dedicated fast path for this by directly
        // setting textContent of the element.
        // for component root it's always normalized anyway.
        (children.length === 1 &&
          (node.type === NodeTypes.ROOT ||
            (node.type === NodeTypes.ELEMENT &&
              node.tagType === ElementTypes.ELEMENT)))
      ) {
        return
      }

      // pre-convert text nodes into createTextVNode(text) calls to avoid
      // runtime normalization.
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs: CallExpression['arguments'] = []
          // createTextVNode defaults to single whitespace, so if it is a
          // single space the code could be an empty call to save bytes.
          if (child.type !== NodeTypes.TEXT || child.content !== ' ') {
            callArgs.push(child)
          }
          // mark dynamic text with flag so it gets patched inside a block
          if (
            !context.ssr &&
            getConstantType(child) === ConstantTypes.NOT_CONSTANT
          ) {
            callArgs.push(
              PatchFlags.TEXT +
                (__DEV__ ? ` /* ${PatchFlagNames[PatchFlags.TEXT]} */` : ``)
            )
          }
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            )
          }
        }
      }
    }
  }
}
