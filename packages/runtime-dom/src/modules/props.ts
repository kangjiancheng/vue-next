// __UNSAFE__
// Reason: potentially setting innerHTML.
// This can come from explicit usage of v-html or innerHTML as a prop in render

import { warn } from '@vue/runtime-core'

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
  unmountChildren: any
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

  if (key === 'value' && el.tagName !== 'PROGRESS') {
    // store value as _value as well since
    // non-string values will be stringified.
    el._value = value
    const newValue = value == null ? '' : value
    if (el.value !== newValue) {
      // 如果属性值不一样，旧替换
      el.value = newValue
    }
    return
  }

  // 属性值 为空处理
  if (value === '' || value == null) {
    const type = typeof el[key]
    if (value === '' && type === 'boolean') {
      // boolean 属性
      // e.g. <select multiple> compiles to { multiple: '' }
      el[key] = true
      return
    } else if (value == null && type === 'string') {
      // 字符串 属性
      // e.g. <div :id="null">
      el[key] = ''
      el.removeAttribute(key)
      return
    } else if (type === 'number') {
      // 数字 属性
      // e.g. <img :width="null">
      el[key] = 0
      el.removeAttribute(key)
      return
    }
  }

  // some properties perform value validation and throw
  try {
    el[key] = value
  } catch (e) {
    if (__DEV__) {
      warn(
        `Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
          `value ${value} is invalid.`,
        e
      )
    }
  }
}
