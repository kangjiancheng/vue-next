import type { VNode, VNodeChild } from '../vnode'
import { isArray, isObject, isString } from '@vue/shared'
import { warn } from '../warning'

/**
 * v-for string
 * @private
 */
export function renderList(
  source: string,
  renderItem: (value: string, index: number) => VNodeChild,
): VNodeChild[]

/**
 * v-for number
 */
export function renderList(
  source: number,
  renderItem: (value: number, index: number) => VNodeChild,
): VNodeChild[]

/**
 * v-for array
 */
export function renderList<T>(
  source: T[],
  renderItem: (value: T, index: number) => VNodeChild,
): VNodeChild[]

/**
 * v-for iterable
 */
export function renderList<T>(
  source: Iterable<T>,
  renderItem: (value: T, index: number) => VNodeChild,
): VNodeChild[]

/**
 * v-for object
 */
export function renderList<T>(
  source: T,
  renderItem: <K extends keyof T>(
    value: T[K],
    key: string,
    index: number,
  ) => VNodeChild,
): VNodeChild[]

/**
 * Actual implementation
 */
// template:
//       <ul class="item-list">
//         <li class="item" :class="{ active: item.id === 1 }" v-for="(item, index) of items" :key="item.id">{{ item.name }}</li>
//       </ul>
//
// render code:
//
//     "const _Vue = Vue
//     const { createVNode: _createVNode } = _Vue
//
//     const _hoisted_1 = { class: "item-list" }
//
//     return function render(_ctx, _cache) {
//       with (_ctx) {
//         const { renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createBlock: _createBlock, toDisplayString: _toDisplayString, createVNode: _createVNode } = _Vue
//
//         return (_openBlock(), _createBlock("ul", _hoisted_1, [
//           (_openBlock(true), _createBlock(_Fragment, null, _renderList(items, (item, index) => {
//             return (_openBlock(), _createBlock("li", {
//               class: ["item", { active: item.id === 1 }],
//               key: item.id
//             }, _toDisplayString(item.name), 3 /* TEXT, CLASS */))
//           }), 128 /* KEYED_FRAGMENT */))
//         ]))
//       }
//     }"
// 生成 v-for的vnode子节点列表
export function renderList(
  source: any,
  renderItem: (...args: any[]) => VNodeChild,
  cache?: any[],
  index?: number,
): VNodeChild[] {
  let ret: VNodeChild[]
  const cached = (cache && cache[index!]) as VNode[] | undefined

  if (isArray(source) || isString(source)) {
    // 遍历数组或字符串

    ret = new Array(source.length)
    for (let i = 0, l = source.length; i < l; i++) {
      // 开始执行渲染
      ret[i] = renderItem(source[i], i, undefined, cached && cached[i])
    }
  } else if (typeof source === 'number') {
    // 遍历数字
    if (__DEV__ && !Number.isInteger(source)) {
      warn(`The v-for range expect an integer value but got ${source}.`)
    }
    ret = new Array(source)
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i, undefined, cached && cached[i])
    }
  } else if (isObject(source)) {
    // 遍历 对象

    if (source[Symbol.iterator as any]) {
      ret = Array.from(source as Iterable<any>, (item, i) =>
        renderItem(item, i, undefined, cached && cached[i]),
      )
    } else {
      const keys = Object.keys(source)
      ret = new Array(keys.length)
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i]
        ret[i] = renderItem(source[key], key, i, cached && cached[i])
      }
    }
  } else {
    ret = []
  }

  if (cache) {
    cache[index!] = ret
  }
  return ret
}
