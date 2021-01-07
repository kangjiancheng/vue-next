/**
 * 编译template模板入口，得到render函数
 */
import {
  baseCompile,
  baseParse,
  CompilerOptions,
  CodegenResult,
  ParserOptions,
  RootNode,
  noopDirectiveTransform,
  NodeTransform,
  DirectiveTransform
} from '@vue/compiler-core'
import { parserOptions } from './parserOptions'
import { transformStyle } from './transforms/transformStyle'
import { transformVHtml } from './transforms/vHtml'
import { transformVText } from './transforms/vText'
import { transformModel } from './transforms/vModel'
import { transformOn } from './transforms/vOn'
import { transformShow } from './transforms/vShow'
import { warnTransitionChildren } from './transforms/warnTransitionChildren'
import { stringifyStatic } from './transforms/stringifyStatic'
import { ignoreSideEffectTags } from './transforms/ignoreSideEffectTags'
import { extend } from '@vue/shared'

export { parserOptions }

// 生成ast语法树后，transform阶段，其中dom节点需要进一步调整的内容
export const DOMNodeTransforms: NodeTransform[] = [
  transformStyle, // 转换ast语法树中的静态style属性节点为指令属性节点
  ...(__DEV__ ? [warnTransitionChildren] : []) // transition 组件下只能接收一个子元素/子组件
]

// 在解析ast语法树后，在transform阶段中，执行转换transformElement时，会解析以下指令
export const DOMDirectiveTransforms: Record<string, DirectiveTransform> = {
  cloak: noopDirectiveTransform, // 解析 v-cloak，返回空属性列表 { props: [] }
  html: transformVHtml, // 解析 v-html指令，属性值必须存在，覆盖子内容
  text: transformVText, // 解析 v-text指令，属性值必须存在，覆盖子内容
  model: transformModel, // 先在compiler-core中解析指令属性节点，再进一步针对dom元素上的v-model，解析使用环境，如需在文本框中使用，并设置needRuntime，过滤一些只在组件上有意义的v-model属性节点信息
  on: transformOn, // 先在compiler-core on，再处理指令修饰符modifiers，进一步转换属性值节点、属性名节点格式
  show: transformShow // 解析v-show，必须设置属性值，返回空属性列表，设置needRuntime
}

// 开始编译 template模板，得到render函数
export function compile(
  template: string,
  options: CompilerOptions = {}
): CodegenResult {
  return baseCompile(
    template,
    extend({}, parserOptions, options, {
      // transform阶段
      nodeTransforms: [
        // ignore <script> and <tag>
        // this is not put inside DOMNodeTransforms because that list is used
        // by compiler-ssr to generate vnode fallback branches
        ignoreSideEffectTags, // 生成ast语法树后，在transform阶段 移除 script 与 style 标签节点
        ...DOMNodeTransforms,
        ...(options.nodeTransforms || [])
      ],
      // transform阶段
      directiveTransforms: extend(
        {},
        DOMDirectiveTransforms,
        options.directiveTransforms || {}
      ),
      // hoistStatic 静态提升
      transformHoist: __BROWSER__ ? null : stringifyStatic
    })
  )
}

export function parse(template: string, options: ParserOptions = {}): RootNode {
  return baseParse(template, extend({}, parserOptions, options))
}

export * from './runtimeHelpers'
export { transformStyle } from './transforms/transformStyle'
export { createDOMCompilerError, DOMErrorCodes } from './errors'
export * from '@vue/compiler-core'
