import {
  createStructuralDirectiveTransform,
  TransformContext,
  traverseNode
} from '../transform'
import {
  NodeTypes,
  ElementTypes,
  ElementNode,
  DirectiveNode,
  IfBranchNode,
  SimpleExpressionNode,
  createCallExpression,
  createConditionalExpression,
  createSimpleExpression,
  createObjectProperty,
  createObjectExpression,
  IfConditionalExpression,
  BlockCodegenNode,
  IfNode,
  createVNodeCall,
  AttributeNode,
  locStub,
  CacheExpression,
  ConstantTypes
} from '../ast'
import { createCompilerError, ErrorCodes } from '../errors'
import { processExpression } from './transformExpression'
import { validateBrowserExpression } from '../validateExpression'
import {
  CREATE_BLOCK,
  FRAGMENT,
  CREATE_COMMENT,
  OPEN_BLOCK
} from '../runtimeHelpers'
import { injectProp, findDir, findProp } from '../utils'
import { PatchFlags, PatchFlagNames } from '@vue/shared'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    // 添加解析v-if插件
    // isRoot 表示当前if branches开始的if节点
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      // #1587: We need to dynamically increment the key based on the current
      // node's sibling nodes, since chained v-if/else branches are
      // rendered at the same depth
      const siblings = context.parent!.children
      let i = siblings.indexOf(ifNode) // 相邻的if节点的位置
      let key = 0 // 统计前边所有的if，else，else-if数量
      while (i-- >= 0) {
        const sibling = siblings[i] // 上一个兄弟节点
        if (sibling && sibling.type === NodeTypes.IF) {
          key += sibling.branches.length // 前边的每个if系列节点
        }
      }

      // 获得v-if解析插件
      // Exit callback. Complete the codegenNode when all children have been
      // transformed.
      return () => {
        if (isRoot) {
          // 正在解析 if节点对应的codegenNode
          ifNode.codegenNode = createCodegenNodeForBranch(
            branch, // if 节点的 对应branch节点
            key, // 从前边的if系列开始计数
            context
          ) as IfConditionalExpression
        } else {
          // 正在解析 else节点或 else-if节点
          // attach this branch's codegen node to the v-if root.
          const parentCondition = getParentCondition(ifNode.codegenNode!)
          parentCondition.alternate = createCodegenNodeForBranch(
            branch,
            key + ifNode.branches.length - 1,
            context
          )
        }
      }
    })
  }
)

// 添加v-if解析插件，移除兄弟节点中的 注释节点、空文本节点
// target-agnostic transform used for both Client and SSR
export function processIf(
  node: ElementNode,
  dir: DirectiveNode, // /^(if|else|else-if)$/
  context: TransformContext,
  processCodegen?: (
    node: IfNode,
    branch: IfBranchNode,
    isRoot: boolean
  ) => (() => void) | undefined
) {
  // v-if/v-else-if  必须有表达式值
  if (
    dir.name !== 'else' &&
    (!dir.exp || !(dir.exp as SimpleExpressionNode).content.trim())
  ) {
    const loc = dir.exp ? dir.exp.loc : node.loc
    context.onError(
      createCompilerError(ErrorCodes.X_V_IF_NO_EXPRESSION, dir.loc) // v-if/v-else-if is missing expression
    )
    dir.exp = createSimpleExpression(`true`, false, loc) // 默认设置为 true
  }

  // TODO: analyze - !__BROWSER__
  if (!__BROWSER__ && context.prefixIdentifiers && dir.exp) {
    // dir.exp can only be simple expression because vIf transform is applied
    // before expression transform.
    dir.exp = processExpression(dir.exp as SimpleExpressionNode, context)
  }

  // 校验指令表达式值的js语法
  if (__DEV__ && __BROWSER__ && dir.exp) {
    validateBrowserExpression(dir.exp as SimpleExpressionNode, context)
  }

  if (dir.name === 'if') {
    // 解析 v-if，创建新节点，替换旧节点
    const branch = createIfBranch(node, dir)
    const ifNode: IfNode = {
      type: NodeTypes.IF,
      loc: node.loc,
      branches: [branch] // if分支节点列表： 保存if节点 和 对应的else节点、else-if节点
    }
    context.replaceNode(ifNode)
    if (processCodegen) {
      return processCodegen(ifNode, branch, true)
    }
  } else {
    // 解析 v-else-if 和 v-else，匹配前边的v-if 节点

    // locate the adjacent v-if
    const siblings = context.parent!.children // 父元素的子节点列表，即兄弟元素
    const comments = []
    let i = siblings.indexOf(node) // 当前节点的位置
    while (i-- >= -1) {
      // 如果上一个相邻节点存在

      // 移除之前相邻的 注释节点 ，追加到注释列表中
      const sibling = siblings[i]
      if (__DEV__ && sibling && sibling.type === NodeTypes.COMMENT) {
        context.removeNode(sibling)
        comments.unshift(sibling)
        continue
      }

      // 移除之前相邻的 空白节点
      if (
        sibling &&
        sibling.type === NodeTypes.TEXT &&
        !sibling.content.trim().length
      ) {
        context.removeNode(sibling)
        continue
      }

      if (sibling && sibling.type === NodeTypes.IF) {
        // 匹配到相邻到 if 节点

        // 创建新的当前节点，如else节点 移到 if节点系列中
        // move the node to the if node's branches
        context.removeNode()
        const branch = createIfBranch(node, dir) // 创建一个 v-if分支系列

        if (__DEV__ && comments.length) {
          // 添加前边注释节点列表到当前else节点列表中（并列）
          branch.children = [...comments, ...branch.children]
        }

        // 如 else 中的key 不可以和if一样
        // check if user is forcing same key on different branches
        if (__DEV__ || !__BROWSER__) {
          const key = branch.userKey // 如 else 节点
          if (key) {
            // if 节点
            sibling.branches.forEach(({ userKey }) => {
              if (isSameKey(userKey, key)) {
                context.onError(
                  createCompilerError(
                    ErrorCodes.X_V_IF_SAME_KEY, // v-if/else branches must use unique keys.
                    branch.userKey!.loc
                  )
                )
              }
            })
          }
        }

        // if 节点的 branches， branch 为 else节点
        sibling.branches.push(branch)
        const onExit = processCodegen && processCodegen(sibling, branch, false)
        // since the branch was removed, it will not be traversed.
        // make sure to traverse here.
        traverseNode(branch, context) // 遍历解析当前节点及其子节点列表
        // call on exit
        if (onExit) onExit()
        // make sure to reset currentNode after traversal to indicate this
        // node has been removed.
        context.currentNode = null
      } else {
        // 前边未匹配到 if
        context.onError(
          createCompilerError(ErrorCodes.X_V_ELSE_NO_ADJACENT_IF, node.loc) // v-else/v-else-if has no adjacent v-if.
        )
      }
      break
    }
  }
}

// 创建 v-if系列分支节点（包括else、else-if）
function createIfBranch(node: ElementNode, dir: DirectiveNode): IfBranchNode {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: node.loc,
    condition: dir.name === 'else' ? undefined : dir.exp, // 条件表达式
    // 当前if 或 else 节点
    children:
      node.tagType === ElementTypes.TEMPLATE && !findDir(node, 'for')
        ? node.children // <template v-if、else、else-if></template>
        : [node], // <template v-if v-for>...</template> 或 <div v-if>...</div>
    userKey: findProp(node, `key`) // 获取 :key 指令节点
  }
}

// 创建v-if 节点的codegen
function createCodegenNodeForBranch(
  branch: IfBranchNode, // 当前节点（if/else/else-if）对应的branch节点
  keyIndex: number, // // 从前边的if系列开始计数
  context: TransformContext
): IfConditionalExpression | BlockCodegenNode {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      // make sure to pass in asBlock: true so that the comment node call
      // closes the current block.
      createCallExpression(context.helper(CREATE_COMMENT), [
        __DEV__ ? '"v-if"' : '""',
        'true'
      ])
    ) as IfConditionalExpression
  } else {
    return createChildrenCodegenNode(branch, keyIndex, context)
  }
}

// 创建v-if 节点的codegen
function createChildrenCodegenNode(
  branch: IfBranchNode, // 当前节点（if/else/else-if）对应的branch节点
  keyIndex: number, // // 从前边的if系列开始计数
  context: TransformContext
): BlockCodegenNode {
  const { helper } = context
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(
      `${keyIndex}`,
      false,
      locStub,
      ConstantTypes.CAN_HOIST
    )
  )
  const { children } = branch
  const firstChild = children[0] // 即当前节点（if/else/else-if）
  const needFragmentWrapper =
    children.length !== 1 || firstChild.type !== NodeTypes.ELEMENT // 如前边存在注释节点

  if (needFragmentWrapper) {
    if (children.length === 1 && firstChild.type === NodeTypes.FOR) {
      // 因为 tranformFor 插件在 if插件之前，所以会被先解析为NodeTypes.FOR
      // optimize away nested fragments when child is a ForNode
      // 如：<div v-if="true" v-for="item in items"></div>
      const vnodeCall = firstChild.codegenNode!
      injectProp(vnodeCall, keyProperty, context)
      return vnodeCall
    } else {
      return createVNodeCall(
        context,
        helper(FRAGMENT),
        createObjectExpression([keyProperty]),
        children,
        PatchFlags.STABLE_FRAGMENT +
          (__DEV__
            ? ` /* ${PatchFlagNames[PatchFlags.STABLE_FRAGMENT]} */`
            : ``),
        undefined,
        undefined,
        true,
        false,
        branch.loc
      )
    }
  } else {
    const vnodeCall = (firstChild as ElementNode)
      .codegenNode as BlockCodegenNode
    // Change createVNode to createBlock.
    if (vnodeCall.type === NodeTypes.VNODE_CALL) {
      vnodeCall.isBlock = true
      helper(OPEN_BLOCK)
      helper(CREATE_BLOCK)
    }
    // inject branch key
    injectProp(vnodeCall, keyProperty, context)
    return vnodeCall
  }
}

function isSameKey(
  a: AttributeNode | DirectiveNode | undefined,
  b: AttributeNode | DirectiveNode
): boolean {
  if (!a || a.type !== b.type) {
    return false
  }
  if (a.type === NodeTypes.ATTRIBUTE) {
    if (a.value!.content !== (b as AttributeNode).value!.content) {
      return false
    }
  } else {
    // directive
    const exp = a.exp!
    const branchExp = (b as DirectiveNode).exp!
    if (exp.type !== branchExp.type) {
      return false
    }
    if (
      exp.type !== NodeTypes.SIMPLE_EXPRESSION ||
      (exp.isStatic !== (branchExp as SimpleExpressionNode).isStatic ||
        exp.content !== (branchExp as SimpleExpressionNode).content)
    ) {
      return false
    }
  }
  return true
}

function getParentCondition(
  node: IfConditionalExpression | CacheExpression
): IfConditionalExpression {
  while (true) {
    if (node.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
      if (node.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
        node = node.alternate
      } else {
        return node
      }
    } else if (node.type === NodeTypes.JS_CACHE_EXPRESSION) {
      node = node.value as IfConditionalExpression
    }
  }
}
