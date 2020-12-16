import {
  transformModel as baseTransform,
  DirectiveTransform,
  ElementTypes,
  findProp,
  NodeTypes,
  hasDynamicKeyVBind
} from '@vue/compiler-core'
import { createDOMCompilerError, DOMErrorCodes } from '../errors'
import {
  V_MODEL_CHECKBOX,
  V_MODEL_RADIO,
  V_MODEL_SELECT,
  V_MODEL_TEXT,
  V_MODEL_DYNAMIC
} from '../runtimeHelpers'

/**
 * 解析v-model指令：
 *    在compiler-core中解析：指令属性名节点、属性值节点、（组件）修饰符节点。
 *    在compiler-dom中解析：进一步针对dom元素上的v-model，解析使用环境，如需在文本框中使用，并设置needRuntime，过滤一些只在组件上有意义的v-model属性节点信息。
 * @param dir v-model指令节点
 * @param node  dom元素或组件元素
 * @param context
 */
export const transformModel: DirectiveTransform = (dir, node, context) => {
  // 先使用 compiler-core 的 transform model 进行处理
  // 返回 { props: [属性名节点、属性值节点、修饰符节点]}，组件会有修饰符节点
  const baseResult = baseTransform(dir, node, context)

  // base transform has errors OR component v-model (only need props)
  if (!baseResult.props.length || node.tagType === ElementTypes.COMPONENT) {
    // baseResult 有问题，如 template: '<span v-model></span>'，需要属性值节点
    // 标签类型为组件，只作为props处理，dom元素的话,需要考虑input各种类型
    return baseResult
  }

  // 解析 ElementTypes.ELEMENT 标签类型上的v-model指令，获取input上的使用情况

  if (dir.arg) {
    // 不支持 动态指令参数，如： v-model:someArg='inputValue'
    context.onError(
      createDOMCompilerError(
        DOMErrorCodes.X_V_MODEL_ARG_ON_ELEMENT, // v-model argument is not supported on plain elements.
        dir.arg.loc
      )
    )
  }

  // 使用v-model后，就没必要再添加value属性
  function checkDuplicatedValue() {
    const value = findProp(node, 'value')
    if (value) {
      // 添加多余的value属性，干扰v-model，如： '<input v-model="inputValue" value="inputValue" type="text" />'
      context.onError(
        createDOMCompilerError(
          DOMErrorCodes.X_V_MODEL_UNNECESSARY_VALUE, // Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.
          value.loc
        )
      )
    }
  }

  // 解析v-model所在的文本框类别，并设置 needRuntime

  const { tag } = node
  const isCustomElement = context.isCustomElement(tag) // instance.appContext.config.isCustomElement = NO = () => false
  if (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    isCustomElement // 用户自定义元素
  ) {
    let directiveToUse = V_MODEL_TEXT // v-model指令使用场景，默认所在文本框的 type 文本，设置 needRuntime
    let isInvalidType = false // 无效的使用场景，如 type="file"，因为文件只能读
    if (tag === 'input' || isCustomElement) {
      // input 或 用户定义

      const type = findProp(node, `type`)
      // type 为静态属性 或 静态指令属性
      if (type) {
        if (type.type === NodeTypes.DIRECTIVE) {
          // 静态指令属性，如 template: '<input v-model="inputValue" :type="xxx" />', xxx = 'text'
          directiveToUse = V_MODEL_DYNAMIC // type 为 动态
        } else if (type.value) {
          // 静态属性，如 template: '<input v-model="inputValue" type="xxx" />'
          switch (type.value.content) {
            // 属性值节点内容
            case 'radio': // '<input v-model="inputValue" type="radio" />'
              directiveToUse = V_MODEL_RADIO
              break
            case 'checkbox': // '<input v-model="inputValue" type="checkbox" />'
              directiveToUse = V_MODEL_CHECKBOX
              break
            case 'file': // '<input v-model="inputValue" type="file" />'
              isInvalidType = true // 无效使用环境
              context.onError(
                createDOMCompilerError(
                  DOMErrorCodes.X_V_MODEL_ON_FILE_INPUT_ELEMENT, // v-model cannot be used on file inputs since they are read-only. Use a v-on:change listener instead.
                  dir.loc
                )
              )
              break
            default:
              // text type
              // 检测是否存在不必要的value属性，如： '<input v-model="inputValue" value="inputValue" type="text" />'
              __DEV__ && checkDuplicatedValue()
              break
          }
        }
      } else if (hasDynamicKeyVBind(node)) {
        // 动态指令属性，动态参数中，可能含有type属性，如：template: '<input v-model="inputValue" :[inputKey]="xxx" />'，inputKey = { type: 'text', placeholder: 'input text'}
        directiveToUse = V_MODEL_DYNAMIC
      } else {
        // text type
        __DEV__ && checkDuplicatedValue() // 检测是否存在不必要的value属性
      }
    } else if (tag === 'select') {
      // 选择框
      directiveToUse = V_MODEL_SELECT
    } else {
      // 解析富文本框： textarea
      __DEV__ && checkDuplicatedValue() // 检测是否存在不必要的value属性
    }

    // inject runtime directive
    // by returning the helper symbol via needRuntime
    // the import will replaced a resolveDirective call.
    if (!isInvalidType) {
      // 默认都有进行
      // input type=file, isInvalidType=true
      baseResult.needRuntime = context.helper(directiveToUse) // 指令使用环境
    }
  } else {
    // 无效的使用方式，如： template: '<span v-model='someText'></span>
    context.onError(
      createDOMCompilerError(
        DOMErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT,
        dir.loc
      )
    )
  }

  // native vmodel doesn't need the `modelValue` props since they are also
  // passed to the runtime as `binding.value`. removing it reduces code size.
  baseResult.props = baseResult.props.filter(
    p =>
      // 过滤一些只针对组件节点的信息，以减少运行时的代码量
      // 移除属性名节点信息，还剩属性值节点、修饰符节点
      !(
        p.key.type === NodeTypes.SIMPLE_EXPRESSION &&
        p.key.content === 'modelValue'
      )
  )

  return baseResult
}
