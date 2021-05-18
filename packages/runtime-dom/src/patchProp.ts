import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchAttr } from './modules/attrs'
import { patchDOMProp } from './modules/props'
import { patchEvent } from './modules/events'
import { isOn, isString, isFunction, isModelListener } from '@vue/shared'
import { RendererOptions } from '@vue/runtime-core'

// 元素dom事件属性，小写，如：<button onclick="handler(event)"></button>，则prop为 onclick
// vue事件：<button @click="handleClick"></button>，则prop为 onClick
const nativeOnRE = /^on[a-z]/

type DOMRendererOptions = RendererOptions<Node, Element>

// 必须更新的dom节点属性
export const forcePatchProp: DOMRendererOptions['forcePatchProp'] = (_, key) =>
  key === 'value'

// 添加或更新 vnode dom实例el 的prop属性
// 当属性值发生变化 会触发更新， dom的value属性强制更新
export const patchProp: DOMRendererOptions['patchProp'] = (
  el, // vnode dom实例
  key, // prop属性名
  prevValue, // prop旧属性值
  nextValue, // prop新属性值
  isSVG = false,
  prevChildren,
  parentComponent, // vnode 父组件实例
  parentSuspense,
  unmountChildren
) => {
  switch (key) {
    // special
    case 'class': // 添加 class属性
      patchClass(el, nextValue, isSVG)
      break
    case 'style': // 添加 style属性
      patchStyle(el, prevValue, nextValue)
      break
    default:
      if (isOn(key)) {
        // 添加 on开头的vue事件属性
        // ignore v-model listeners
        if (!isModelListener(key)) {
          // 忽略 onUpdate:xxx 事件
          // 为el绑定事件及事件处理函数
          patchEvent(el, key, prevValue, nextValue, parentComponent)
        }
      } else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
        // dom 实例属性，如： innerHTML、id
        patchDOMProp(
          el,
          key,
          nextValue,
          prevChildren,
          parentComponent,
          parentSuspense,
          unmountChildren
        )
      } else {
        // dom 标签属性(即一些非dom实例属性)： 即直接添加到标签到属性列表上，如value 或 一些自定义到属性 data-xxx
        // special case for <input v-model type="checkbox"> with
        // :true-value & :false-value
        // store value as dom properties since non-string values will be
        // stringified.
        if (key === 'true-value') {
          ;(el as any)._trueValue = nextValue
        } else if (key === 'false-value') {
          ;(el as any)._falseValue = nextValue
        }
        patchAttr(el, key, nextValue, isSVG, parentComponent)
      }
      break
  }
}

// 是否作为dom的实例属性
function shouldSetAsProp(
  el: Element, // vnode 的dom实例el
  key: string, // prop属性名
  value: unknown, // prop属性值
  isSVG: boolean
) {
  if (isSVG) {
    // most keys must be set as attribute on svg elements to work
    // ...except innerHTML
    if (key === 'innerHTML') {
      return true
    }
    // or native onclick with function values
    if (key in el && nativeOnRE.test(key) && isFunction(value)) {
      return true
    }
    return false
  }

  // spellcheck and draggable are numerated attrs, however their
  // corresponding DOM properties are actually booleans - this leads to
  // setting it with a string "false" value leading it to be coerced to
  // `true`, so we need to always treat them as attributes.
  // Note that `contentEditable` doesn't have this problem: its DOM
  // property is also enumerated string values.
  if (key === 'spellcheck' || key === 'draggable') {
    return false
  }

  // #1787, #2840 form property on form elements is readonly and must be set as
  // attribute.
  if (key === 'form') {
    return false
  }

  // #1526 <input list> must be set as attribute
  if (key === 'list' && el.tagName === 'INPUT') {
    return false
  }

  // #2766 <textarea type> must be set as attribute
  if (key === 'type' && el.tagName === 'TEXTAREA') {
    return false
  }

  // native onclick with string value, must be set as attribute
  if (nativeOnRE.test(key) && isString(value)) {
    return false
  }

  return key in el
}
