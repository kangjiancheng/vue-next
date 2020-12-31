/**
 * 编译template模板，得到render函数
 */

import { CompilerOptions } from './options'
import { baseParse } from './parse'
import { transform, NodeTransform, DirectiveTransform } from './transform'
import { generate, CodegenResult } from './codegen'
import { RootNode } from './ast'
import { isString, extend } from '@vue/shared'
import { transformIf } from './transforms/vIf'
import { transformFor } from './transforms/vFor'
import { transformExpression } from './transforms/transformExpression'
import { transformSlotOutlet } from './transforms/transformSlotOutlet'
import { transformElement } from './transforms/transformElement'
import { transformOn } from './transforms/vOn'
import { transformBind } from './transforms/vBind'
import { trackSlotScopes, trackVForSlotScopes } from './transforms/vSlot'
import { transformText } from './transforms/transformText'
import { transformOnce } from './transforms/vOnce'
import { transformModel } from './transforms/vModel'
import { defaultOnError, createCompilerError, ErrorCodes } from './errors'

export type TransformPreset = [
  NodeTransform[],
  Record<string, DirectiveTransform>
]

export function getBaseTransformPreset(
  prefixIdentifiers?: boolean
): TransformPreset {
  return [
    // 默认 nodeTransforms compiler-core
    [
      transformOnce, // 处理 v-once 指令属性节点，编译一次节点，不进行再次编译，缓存codegenNode
      transformIf, // 处理 v-if 指令属性节点，在添加插件时，会先插件一个新的if branch node分支流节点，将之后的else-f、else节点移进来，创建if codegenNode，并将else-if、else的codegenNode链式绑定到if分支流节点
      transformFor, // 处理 v-for 指令属性节点， 在添加插件时，会先创建一个新的for node 类型节点，并替换当前for类型的节点，之后会处理slot场景下的v-for，和template场景下的v-for，包括对key属性的处理，并生成for节点的codegenNode
      ...(!__BROWSER__ && prefixIdentifiers
        ? [
            // order is important
            trackVForSlotScopes,
            transformExpression
          ]
        : __BROWSER__ && __DEV__
          ? [transformExpression] // 处理插值表达式内容，指令属性节点值表达式，排除v-for和v-on:arg属性节点，在浏览器中只需要节点验证表达式值的js语法规则：validateBrowserExpression
          : []),
      transformSlotOutlet, // 处理插值表达式内容，指令属性节点值表达式，排除v-for和v-on:arg属性节点，在浏览器中只需要节点验证表达式值的js语法规则：validateBrowserExpression
      transformElement, // 处理html元素节点或组件节点，解析元素节点的prop属性列表（on/bind/model/text/html/show/is）、v-slot指令与默认/具名插槽转换、patchFlag信息、用户定义的指令等，为当前节点的ast生成对应的codegen vnode执行函数节点
      trackSlotScopes, // 处理并跟踪节点的slot指令，通过计数来识别出是否内嵌了slot指令，为transformElement检测是否定义了动态slot，创建对应的patchflag信息
      transformText // 处理 连续子文本节点/表达式节点 的合并；或 如果即包含文本又包含其它类型节点时，则需要设置该子节点文本/表达式的diff patch codegenNode 信息，同时也重新定义当前节点的子节点配置

      // compiler-dom:
      // transformStyle,                      // 不返回回调转换插件， html元素全部转换静态style属性为对应的动态style指令属性节点
      // warnTransitionChildren               // transition组件只接收一个子元素/子组件
    ],
    // 默认 directiveTransforms
    // transformElement阶段
    {
      on: transformOn, // 转换指令属性名、校验属性值、属性值节点为codegen节点，校验属性值js语法
      bind: transformBind, // 转换v-bind指令属性节点，如转换属性名为小驼峰、校验属性值
      model: transformModel // 解析dom/组件节点上 v-model指令，返回 { props: [属性名节点、属性值节点、修饰符节点]}，如校验属性值节点不能为空，属性值内容格式必须是一个有效的js变量应用：$_abc[foo][bar] 或 $_abc.foo.bar
    }
  ]
}

/**
 * 编译 开始，返回render函数
 * @param template，模板
 * @param options，编译选项
 */
// we name it `baseCompile` so that higher order compilers like
// @vue/compiler-dom can export `compile` while re-exporting everything else.
export function baseCompile(
  template: string | RootNode,
  options: CompilerOptions = {}
): CodegenResult {
  const onError = options.onError || defaultOnError
  const isModuleMode = options.mode === 'module'
  /* istanbul ignore if */
  if (__BROWSER__) {
    if (options.prefixIdentifiers === true) {
      onError(createCompilerError(ErrorCodes.X_PREFIX_ID_NOT_SUPPORTED))
    } else if (isModuleMode) {
      onError(createCompilerError(ErrorCodes.X_MODULE_MODE_NOT_SUPPORTED))
    }
  }

  const prefixIdentifiers =
    !__BROWSER__ && (options.prefixIdentifiers === true || isModuleMode)
  if (!prefixIdentifiers && options.cacheHandlers) {
    onError(createCompilerError(ErrorCodes.X_CACHE_HANDLER_NOT_SUPPORTED))
  }
  if (options.scopeId && !isModuleMode) {
    onError(createCompilerError(ErrorCodes.X_SCOPE_ID_NOT_SUPPORTED))
  }

  // 解析模板，生成语法树ast：解析模版元素、元素标签、元素指令、元素内容、子元素内容等
  const ast = isString(template) ? baseParse(template, options) : template

  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset(
    prefixIdentifiers
  )
  // 进一步转换ast语法树中的节点，如：解析节点上的指令、属性、解析组件、解析子元素文本、解析元素等等并获取对应的codegenNode。
  transform(
    ast,
    extend({}, options, {
      prefixIdentifiers,
      nodeTransforms: [
        ...nodeTransforms, // 默认需要调整的配置
        ...(options.nodeTransforms || []) // user transforms，不同环境下，用户可能需要额外调整，如删减style/script标签节点、将元素节点的静态style属性转换为指令属性
      ],
      directiveTransforms: extend(
        // 处理指令
        {},
        directiveTransforms,
        options.directiveTransforms || {} // user transforms
      )
    })
  )

  return generate(
    ast,
    extend({}, options, {
      prefixIdentifiers
    })
  )
}
