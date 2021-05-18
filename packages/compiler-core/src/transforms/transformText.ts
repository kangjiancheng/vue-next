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

// 合并处理节点的子文本节点内容

// 如果当前节点没有文本/表达式节点 或只有文本/表达式节点，则合并处理连续子文本节点/表达式节点，转换为新的 混合子节点，即混合子节点的children属性存储着原先的连续子文本节点
// 如 template: '{{ foo }}   {{ bar }}'，合并文本/表达式节点

// 如果当前节点下存在不只文本/表达式节点，则需要进一步处理，获取文本/表达式对应的patchflag方法，主要是处理表达式节点即插值: '{{}}'
// 同时设置 文本节点 patch时，生成对应代码的配置
// 如 template: '{{ foo }}   {{ bar }} <span>123</span>'，合并文本并创建对应的patch createTextVNode(text)方法

// Merge adjacent text nodes and expressions into a single expression
// e.g. <div>abc {{ d }} {{ e }}</div> should have a single expression node as child.
export const transformText: NodeTransform = (node, context) => {
  // 不处理 文本节点
  if (
    node.type === NodeTypes.ROOT || // ast跟节点下，存在text文本/插值表达式节点
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR || // 在添加for transform插件时，会新生成for节点
    node.type === NodeTypes.IF_BRANCH
  ) {
    // 在节点退出时 执行transform，因为此时所以表达式都已经被处理了
    // perform the transform on node exit so that all expressions have already
    // been processed.
    return () => {
      // 合并处理当前节点的子节点
      const children = node.children
      let currentContainer: CompoundExpressionNode | undefined = undefined // 当前元素的混合子节点，存储连续的文本子节点
      let hasText = false

      // 合并处理子节点中的连续文本节点，同时移除已合并的子节点
      for (let i = 0; i < children.length; i++) {
        const child = children[i] // 子节点元素
        if (isText(child)) {
          // 判断子节点是否是 文本节点 或 插值节点
          hasText = true
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j] // 子节点元素
            if (isText(next)) {
              // 如果下一个也是文本/插值节点
              if (!currentContainer) {
                // 将当前文本节点添加到 合并节点 列表中去，同时修改原ast对应的当前在处理的ast节点的子节点列表
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION, // 合成表达式节点
                  loc: child.loc, // 第一个信息
                  children: [child] // NodeTypes.INTERPOLATION 、 NodeTypes.TEXT
                }
              }
              // merge adjacent text node into current
              currentContainer.children.push(` + `, next) // 将下一个文本节点添加到 合并节点 的子节点列表中，注意数组中还加入了一个 '+' 加号元素，currentContainer.children: [{...}, ' + ', {...}, ...]
              children.splice(j, 1) // 合并后，删除原先子节点
              j-- // 合并删除后，回退原先位置
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
          (node.type === NodeTypes.ROOT || // template模版节点为 文本节点，如 template: '文本或js表达式{{ xxx }}，没有其它标签节点'
            (node.type === NodeTypes.ELEMENT && // 或 当前节点为 html dom元素节点，且只有文本子节点
              node.tagType === ElementTypes.ELEMENT &&
              // #3756
              // custom directives can potentially add DOM elements arbitrarily,
              // we need to avoid setting textContent of the element at runtime
              // to avoid accidentally overwriting the DOM elements added
              // by the user through custom directives.
              !node.props.find(
                p =>
                  p.type === NodeTypes.DIRECTIVE &&
                  !context.directiveTransforms[p.name]
              ) &&
              // in compat mode, <template> tags with no special directives
              // will be rendered as a fragment so its children must be
              // converted into vnodes.
              !(__COMPAT__ && node.tag === 'template'))))
      ) {
        // 不含有文本
        // 或 只有文本子节点（当前节点：根节点/dom标签元素节点）
        return
      }

      // 不纯的子节点：（处理其中的文本合并）
      // 1、即有文本又有其它， 如 template: '{{ foo }} - {{ bar }} <span>123</span>'
      // 2、当前为组件节点，且存在子文本节点，如 template: '<component-demo>123</component-demo>

      // pre-convert text nodes into createTextVNode(text) calls to avoid
      // runtime normalization.
      for (let i = 0; i < children.length; i++) {
        const child = children[i] // 当前节点的子节点(其中如果有连续文本/插值则已经进行合并了)

        // 处理文本/插值子节点
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          // ast文本/插值子节点(说明不是连续的，没有经过合并) 或 混合连续文本子节点(包含合并的子文本节点列表)

          // 保存： 文本子节点 、插值子节点、合并后的连续文本/插值子节点列表，同时还有 PatchFlags 方式
          const callArgs: CallExpression['arguments'] = []

          // createTextVNode defaults to single whitespace, so if it is a
          // single space the code could be an empty call to save bytes.

          if (child.type !== NodeTypes.TEXT || child.content !== ' ') {
            // type: INTERPOLATION 插值、 COMPOUND_EXPRESSION 合并后的连续子节点、 TEXT 纯文本子节点且不是空白(如：template: '{{ foo }}   {{ bar }}'，不处理之间的空白文本子节点)
            callArgs.push(child)
          }

          // 如果是插值子节点、混合子节点下存在插值子节点，需要添加额外patch信息
          // mark dynamic text with flag so it gets patched inside a block
          if (
            !context.ssr &&
            getConstantType(child, context) === ConstantTypes.NOT_CONSTANT // 判断子元素包括混合连续列表里的子文本元素，是否是NOT_CONSTANT类型，
          ) {
            callArgs.push(
              // 存储到插值元素的patch信息： ['插值子节点...', '1 /* TEXT */']
              PatchFlags.TEXT +
                (__DEV__ ? ` /* ${PatchFlagNames[PatchFlags.TEXT]} */` : ``) // 输出 注释，表明diff时，是text patch 方式
            )
          }

          // 重新定义该子节点信息
          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child, // 文本、插值子节点、连续文本/插值子节点
            loc: child.loc, // 子节点位置信息
            codegenNode: createCallExpression(
              // 之后的静态提升与codegen生成节点对应的渲染源码时，会用到
              // 创建patch时相应的回调表达式，对应文本代码生成的配置节点
              context.helper(CREATE_TEXT), // patch 时的方法与描述信息：'Symbol(createTextVNode)'
              callArgs // 对应参数列表， 元素1：INTERPOLATION 插值、 COMPOUND_EXPRESSION 合并后的连续子节点、 TEXT 纯文本子节点且不是空白； 元素2：插值表达式对于的patch flag 注释
            )
          }
        }
      }
    }
  }
}
