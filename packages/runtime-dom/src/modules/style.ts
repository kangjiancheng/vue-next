import { capitalize, hyphenate, isArray, isString } from '@vue/shared'
import { camelize, warn } from '@vue/runtime-core'
import {
  type VShowElement,
  vShowHidden,
  vShowOriginalDisplay,
} from '../directives/vShow'
import { CSS_VAR_TEXT } from '../helpers/useCssVars'

type Style = string | Record<string, string | string[]> | null

// 更新时：删除style空属性null
const displayRE = /(^|;)\s*display\s*:/

// 为vnode dom实例添加style属性
// 如 template:
// '<div>
//   <span style="color: red;"></span>
//   <span :style="'color: red;'"></span>
//   <span :style="redStyle"></span>
//  </div>'
// 则渲染code:
// const _Vue = Vue
// const { createVNode: _createVNode } = _Vue
//
// const _hoisted_1 = /*#__PURE__*/_createVNode("span", { style: {"color":"red"} }, null, -1 /* HOISTED */)
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return (_openBlock(), _createBlock("div", null, [
//       _hoisted_1,
//       _createVNode("span", { style: 'color: red;' }, null, 4 /* STYLE */),
//       _createVNode("span", { style: redStyle }, null, 4 /* STYLE */)
//     ]))
//   }
// }
// 为vnode dom实例添加 或更新 style属性next
export function patchStyle(el: Element, prev: Style, next: Style) {
  const style = (el as HTMLElement).style // vnode el实例style属性
  const isCssString = isString(next)
  let hasControlledDisplay = false
  if (next && !isCssString) {
    // 对象格式，如：(模版编译会自动转换为对象格式)
    // template 如：<span style="color: red; box-align: center;"></span>
    // VNode 则：const _hoisted_1 = /*#__PURE__*/_createVNode("span", { style: {"color":"red","box-align":"center"} }, null, -1 /* HOISTED */)
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, '')
          }
        }
      } else {
        for (const prevStyle of prev.split(';')) {
          const key = prevStyle.slice(0, prevStyle.indexOf(':')).trim()
          if (next[key] == null) {
            setStyle(style, key, '')
          }
        }
      }
    }
    for (const key in next) {
      if (key === 'display') {
        hasControlledDisplay = true
      }
      setStyle(style, key, next[key])
    }
  } else {
    if (isCssString) {
      // 字符串格式，如用户通过render 创建的vnode，可能传入了字符串style
      if (prev !== next) {
        // #9821
        const cssVarText = (style as any)[CSS_VAR_TEXT]
        if (cssVarText) {
          ;(next as string) += ';' + cssVarText
        }
        // 直接修改el的行内style值
        style.cssText = next as string
        hasControlledDisplay = displayRE.test(next)
      }
    } else if (prev) {
      // style 属性值为空
      // template: <div style=""></div>
      el.removeAttribute('style')
    }
  }
  // indicates the element also has `v-show`.
  if (vShowOriginalDisplay in el) {
    // make v-show respect the current v-bind style display when shown
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : ''
    // if v-show is in hidden state, v-show has higher priority
    if ((el as VShowElement)[vShowHidden]) {
      style.display = 'none'
    }
  }
}

const semicolonRE = /[^\\];\s*$/
const importantRE = /\s*!important$/

// 设置style的属性
function setStyle(
  style: CSSStyleDeclaration, // vnode el实例style属性
  name: string, // style 属性名
  val: string | string[], // style 属性值
) {
  if (isArray(val)) {
    val.forEach(v => setStyle(style, name, v))
  } else {
    if (val == null) val = ''
    if (__DEV__) {
      if (semicolonRE.test(val)) {
        warn(
          `Unexpected semicolon at the end of '${name}' style value: '${val}'`,
        )
      }
    }
    if (name.startsWith('--')) {
      // 自定义style属性，如： <span style="--user-info"></span>
      // custom property definition
      style.setProperty(name, val)
    } else {
      // 添加浏览器前缀
      const prefixed = autoPrefix(style, name)
      // 设置important
      if (importantRE.test(val)) {
        // 后缀 !important
        // !important
        // 如：el.style.setProperty('color', 'red', 'important')
        // 直接设置 el.style.color = 'red !important' 无效
        // https://developer.mozilla.org/zh-CN/docs/Web/API/CSSStyleDeclaration/setProperty
        style.setProperty(
          hyphenate(prefixed), // 小写并 '-'分隔
          val.replace(importantRE, ''),
          'important',
        )
      } else {
        // 设置style属性值
        style[prefixed as any] = val
      }
    }
  }
}

const prefixes = ['Webkit', 'Moz', 'ms']
const prefixCache: Record<string, string> = {}

// 为相关浏览器下的style属性添加浏览器标识符前缀
// template 如：<span style="color: red; box-align: center;"></span>
// VNode 则：const _hoisted_1 = /*#__PURE__*/_createVNode("span", { style: {"color":"red","box-align":"center"} }, null, -1 /* HOISTED */)
// 最终el dom节点：<span style="color: red; -webkit-box-align: center;"></span>
function autoPrefix(style: CSSStyleDeclaration, rawName: string): string {
  const cached = prefixCache[rawName]
  if (cached) {
    return cached
  }
  // 短横线 转换为 小驼峰：camelCase，如: 'boxAlign'
  let name = camelize(rawName)
  if (name !== 'filter' && name in style) {
    // 如，在chorome浏览器中 el.style.boxAlign 不存在属性
    return (prefixCache[rawName] = name)
  }
  // 大写第一个字母，如 'BoxAlign'
  name = capitalize(name)
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name // 如，在chorome浏览器中 el.style.webkitBoxAlign 存在属性
    if (prefixed in style) {
      // 则 el.style.webkitBoxAlign = 'center'
      return (prefixCache[rawName] = prefixed)
    }
  }
  return rawName
}
