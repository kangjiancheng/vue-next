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
  OPEN_BLOCK,
  CREATE_VNODE
} from '../runtimeHelpers'
import { injectProp, findDir, findProp, isBuiltInType } from '../utils'
import { PatchFlags, PatchFlagNames } from '@vue/shared'

/**
 * 创建v-if解析插件时，原理是基于 if分支流节点 来解析的，如一个分支流中可能是：if节点、else节点、else-if节点，构成的一个逻辑判断流程。
 * 合并一个if分支流里的if、else-if、else节点到 if分支流节点 中，同时替换ast中的位置。
 * 解析时：创建if codegenNode，并将else-if、else的codegenNode链式绑定到if分支流节点
 * 注意：不处理 <template v-slot></template> v-if节点，由vSlot.ts处理
 */
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    // 添加解析v-if插件
    // ifNode 为当前 if 分支节点 （包含了branch节点）
    // branch if分支流中的一个节点：else-if/else，该节点已经从ast中位置移动到ast中的ifNode节点下。
    // isRoot 表示是否是if branches开始的if节点
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      // #1587: We need to dynamically increment the key based on the current
      // node's sibling nodes, since chained v-if/else branches are
      // rendered at the same depth

      // 注意前边的if分支流节点都已经替换原先ast位置上的节点了
      const siblings = context.parent!.children
      let i = siblings.indexOf(ifNode) // 相邻的if节点的位置
      let key = 0 // 记录 branch 在所有if分支流节点中的位置，即记录该节点（if/else-if/else）在所有兄弟元素if、else-if、else列表中的位置
      while (i-- >= 0) {
        const sibling = siblings[i] // 前边的兄弟节点
        if (sibling && sibling.type === NodeTypes.IF) {
          // 前边兄弟的每个if分支节点
          key += sibling.branches.length
        }
      }

      // 获得v-if解析插件
      // Exit callback. Complete the codegenNode when all children have been
      // transformed.
      return () => {
        if (isRoot) {
          // 创建if节点对应的codegenNode
          ifNode.codegenNode = createCodegenNodeForBranch(
            branch, // if 节点的 对应branch节点
            key, // 记录 branch 在所有if分支流节点中的位置
            context
          ) as IfConditionalExpression
        } else {
          // 解析 else节点或 else-if节点，并将codegenNode链式绑定到if codegenNode的alternate属性上
          // attach this branch's codegen node to the v-if root.
          const parentCondition = getParentCondition(ifNode.codegenNode!) // 递归式获取上一级的alternate codegenNode
          parentCondition.alternate = createCodegenNodeForBranch(
            branch, // else-f/else
            key + ifNode.branches.length - 1, // 记录 branch 在所有if分支流节点中的位置
            context
          )
        }
      }
    })
  }
)

// 添加v-if解析插件
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
        // 匹配前边的if节点
        // 然后将当前的else/else-if节点归并到前边if节点对应的branches里
        // move the node to the if node's branches
        context.removeNode()

        const branch = createIfBranch(node, dir) // 创建一个 v-if分支系列
        // 将else/else-if节点到if节点之间的注释节点列表规划到 当前else/else-if节点分支下
        if (
          __DEV__ &&
          comments.length &&
          // #3619 ignore comments if the v-if is direct child of <transition>
          !(
            context.parent &&
            context.parent.type === NodeTypes.ELEMENT &&
            isBuiltInType(context.parent.tag, 'transition')
          )
        ) {
          branch.children = [...comments, ...branch.children]
        }

        // 该if分支流下，if/else/else-if节点上的key属性不能重复
        // check if user is forcing same key on different branches
        if (__DEV__ || !__BROWSER__) {
          const key = branch.userKey
          if (key) {
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
        traverseNode(branch, context) // 遍历解析当前节点及其子节点列表（因为之后节点会被移到if分支节点中，之后不再在主transform中继续解析其子内容）
        // call on exit
        if (onExit) onExit()
        // make sure to reset currentNode after traversal to indicate this
        // node has been removed.
        // 移除当前节点，因为已经移到了if分支节点中
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

// 创建 if分支流节点的codegenNode
function createCodegenNodeForBranch(
  branch: IfBranchNode, // 当前节点（if/else/else-if）对应的branch节点
  keyIndex: number, // // 从前边的if系列开始计数
  context: TransformContext
): IfConditionalExpression | BlockCodegenNode {
  if (branch.condition) {
    // 创建 if/else-if 条件表达式 codegenNode: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex, context),
      // alternate: NodeTypes.JS_CALL_EXPRESSION
      createCallExpression(context.helper(CREATE_COMMENT), [
        // CREATE_COMMENT = Symbol(__DEV__ ? `createCommentVNode` : ``)
        __DEV__ ? '"v-if"' : '""',
        'true' // make sure to pass in asBlock: true so that the comment node call closes the current block.
      ])
    ) as IfConditionalExpression
  } else {
    // else节点 直接创建codegen
    return createChildrenCodegenNode(branch, keyIndex, context)
  }
}

// 创建 if分支流节点 中的if、else-if、else节点的codegen
function createChildrenCodegenNode(
  branch: IfBranchNode, // 节点（if/else/else-if）对应的branch节点
  keyIndex: number, // // 当前节点branch，在所有if/else/else-if 节点中的位置
  context: TransformContext
): BlockCodegenNode {
  const { helper, removeHelper } = context
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(
      `${keyIndex}`,
      false,
      locStub,
      ConstantTypes.CAN_HOIST
    )
  )
  const { children } = branch // 保存 注释/if/else/else-if节点
  const firstChild = children[0] // 即当前节点（if/else/else-if）/或注释节点

  // 使用fragment代码片段包裹：
  //    存在注释节点 （else-if/else节点前边到if节点）
  //    存在v-for指令
  const needFragmentWrapper =
    children.length !== 1 || firstChild.type !== NodeTypes.ELEMENT
  if (needFragmentWrapper) {
    if (children.length === 1 && firstChild.type === NodeTypes.FOR) {
      // 存在v-for指令，tranformFor 插件在 if插件之前，所以会被先解析为NodeTypes.FOR
      // 如： template: '<div v-if="true" v-for="item in items"></div>'
      // optimize away nested fragments when child is a ForNode
      const vnodeCall = firstChild.codegenNode!
      // 将key注入到if节点中
      injectProp(vnodeCall, keyProperty, context)
      return vnodeCall
    } else {
      // 存在注释节点，如，template:
      //  <div v-if="true" key="a"></div>
      //  <!-- 123 -->
      //  <div v-else key="b"></div>
      let patchFlag = PatchFlags.STABLE_FRAGMENT
      let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT]
      // check if the fragment actually contains a single valid child with
      // the rest being comments
      if (
        __DEV__ &&
        children.filter(c => c.type !== NodeTypes.COMMENT).length === 1
      ) {
        patchFlag |= PatchFlags.DEV_ROOT_FRAGMENT
        patchFlagText += `, ${PatchFlagNames[PatchFlags.DEV_ROOT_FRAGMENT]}`
      }

      return createVNodeCall(
        context,
        helper(FRAGMENT),
        createObjectExpression([keyProperty]),
        children,
        patchFlag + (__DEV__ ? ` /* ${patchFlagText} */` : ``),
        undefined,
        undefined,
        true,
        false,
        branch.loc
      )
    }
  } else {
    // 纯的节点，if/else/else-if节点，直接
    const vnodeCall = (firstChild as ElementNode)
      .codegenNode as BlockCodegenNode
    // Change createVNode to createBlock.
    if (vnodeCall.type === NodeTypes.VNODE_CALL && !vnodeCall.isBlock) {
      // VNODE_CALL 在transformElement阶段创建
      removeHelper(CREATE_VNODE)
      vnodeCall.isBlock = true
      helper(OPEN_BLOCK)
      helper(CREATE_BLOCK)
    }
    // 注入if分支流的key到branch的prop属性列表中
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

// 返回前边条件节点的codegenNode，即递归查找ifNode链上的最后一个codegenNode（即alternate）
function getParentCondition(
  node: IfConditionalExpression | CacheExpression // ifNode.codegenNode
): IfConditionalExpression {
  while (true) {
    if (node.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
      // if节点

      // node.alternate 上一级（else-if）的codegenNode
      if (node.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
        // 递归找到上一个节点的codegenNode
        // <div v-if="xxx" key="1"></div>
        // <div v-else-if="xxx" key="2"></div>
        // <div v-else-if="xxx" key="3"></div> // 如：在解析key=3 else-if节点时，取得key=2的else-if节点的alternate（即codegenNode），为了之后将key=3的codegenNode链式绑定到key=2的即codegenNode.alternate属性
        // <div v-else key="4"></div>
        node = node.alternate
      } else {
        // 在解析else节点时：template
        //    <div v-if="xxx"></div>
        //    <div v-else></div>
        // 不需要获取上一级
        return node
      }
    } else if (node.type === NodeTypes.JS_CACHE_EXPRESSION) {
      node = node.value as IfConditionalExpression
    }
  }
}
