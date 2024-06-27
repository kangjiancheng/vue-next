// __UNSAFE__
// Reason: potentially setting innerHTML.
// This can come from explicit usage of v-html or innerHTML as a prop in render

import { DeprecationTypes, compatUtils, warn } from '@vue/runtime-core'
import { includeBooleanAttr } from '@vue/shared'

// 添加 vnode dom实例el 的属性，如 id、innerHTML
// functions. The user is responsible for using them with only trusted content.
export function patchDOMProp(
  el: any, // vnode dom实例el
  key: string, // dom prop属性名
  value: any,
  // the following args are passed only due to potential innerHTML/textContent
  // overriding existing VNodes, in which case the old tree must be properly
  // unmounted.
  prevChildren: any,
  parentComponent: any, // vnode 父组件实例
  parentSuspense: any,
  unmountChildren: any,
) {
  // v-html、v-text
  if (key === 'innerHTML' || key === 'textContent') {
    if (prevChildren) {
      // 卸载el子节点列表（因为是先添加el子节点列表，再处理el属性，所以这时候反而需要移除子节点列表）
      unmountChildren(prevChildren, parentComponent, parentSuspense)
    }
    el[key] = value == null ? '' : value // 会直接替换子内容
    return
  }

  const tag = el.tagName

  if (
    key === 'value' &&
    tag !== 'PROGRESS' &&
    // custom elements may use _value internally
    !tag.includes('-')
  ) {
    // #4956: <option> value will fallback to its text content so we need to
    // compare against its attribute value instead.
    const oldValue =
      tag === 'OPTION' ? el.getAttribute('value') || '' : el.value
    const newValue = value == null ? '' : String(value)
    if (oldValue !== newValue || !('_value' in el)) {
      // 如果属性值不一样，就替换
      el.value = newValue
    }
    if (value == null) {
      el.removeAttribute(key)
    }
    // store value as _value as well since
    // non-string values will be stringified.
    el._value = value
    return
  }

  let needRemove = false
  // 属性值 为空处理
  if (value === '' || value == null) {
    const type = typeof el[key]
    if (type === 'boolean') {
      // boolean 属性
      // e.g. <select multiple> compiles to { multiple: '' }
      value = includeBooleanAttr(value)
    } else if (value == null && type === 'string') {
      // 字符串 属性
      // e.g. <div :id="null">
      value = ''
      needRemove = true
    } else if (type === 'number') {
      // 数字 属性
      // e.g. <img :width="null">
      value = 0
      needRemove = true
    }
  } else {
    if (
      __COMPAT__ &&
      value === false &&
      compatUtils.isCompatEnabled(
        DeprecationTypes.ATTR_FALSE_VALUE,
        parentComponent,
      )
    ) {
      const type = typeof el[key]
      if (type === 'string' || type === 'number') {
        __DEV__ &&
          compatUtils.warnDeprecation(
            DeprecationTypes.ATTR_FALSE_VALUE,
            parentComponent,
            key,
          )
        value = type === 'number' ? 0 : ''
        needRemove = true
      }
    }
  }

  // some properties perform value validation and throw,
  // some properties has getter, no setter, will error in 'use strict'
  // eg. <select :type="null"></select> <select :willValidate="null"></select>
  try {
    el[key] = value
  } catch (e: any) {
    // do not warn if value is auto-coerced from nullish values
    if (__DEV__ && !needRemove) {
      warn(
        `Failed setting prop "${key}" on <${tag.toLowerCase()}>: ` +
          `value ${value} is invalid.`,
        e,
      )
    }
  }
  needRemove && el.removeAttribute(key)
}
