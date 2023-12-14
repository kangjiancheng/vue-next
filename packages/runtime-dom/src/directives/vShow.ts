import { ObjectDirective } from '@vue/runtime-core'

export const vShowOldKey = Symbol('_vod')

interface VShowElement extends HTMLElement {
  // _vod = vue original display
  [vShowOldKey]: string
}

// template: '<span v-show="isShow">123</span>'
// 渲染code:
// "const _Vue = Vue
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { vShow: _vShow, createVNode: _createVNode, withDirectives: _withDirectives, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return _withDirectives((_openBlock(), _createBlock("span", null, "123", 512 /* NEED_PATCH */)), [
//       [_vShow, isShow]
//     ])
//   }
export const vShow: ObjectDirective<VShowElement> = {
  // vnode el节点属性props 已经添加了，将要挂载到父节点dom上
  beforeMount(el, { value }, { transition }) {
    el[vShowOldKey] = el.style.display === 'none' ? '' : el.style.display
    if (transition && value) {
      // TODO: transition
      transition.beforeEnter(el)
    } else {
      setDisplay(el, value)
    }
  },
  // 已挂载到父节点dom上
  mounted(el, { value }, { transition }) {
    if (transition && value) {
      transition.enter(el)
    }
  },
  updated(el, { value, oldValue }, { transition }) {
    if (!value === !oldValue) return
    if (transition) {
      if (value) {
        transition.beforeEnter(el)
        setDisplay(el, true)
        transition.enter(el)
      } else {
        transition.leave(el, () => {
          setDisplay(el, false)
        })
      }
    } else {
      setDisplay(el, value)
    }
  },
  beforeUnmount(el, { value }) {
    setDisplay(el, value)
  }
}

function setDisplay(el: VShowElement, value: unknown): void {
  el.style.display = value ? el[vShowOldKey] : 'none'
}

// SSR vnode transforms, only used when user includes client-oriented render
// function in SSR
export function initVShowForSSR() {
  vShow.getSSRProps = ({ value }) => {
    if (!value) {
      return { style: { display: 'none' } }
    }
  }
}
