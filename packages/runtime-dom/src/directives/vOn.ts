import {
  getCurrentInstance,
  DeprecationTypes,
  LegacyConfig,
  compatUtils,
  ComponentInternalInstance
} from '@vue/runtime-core'
import { hyphenate, isArray } from '@vue/shared'

const systemModifiers = ['ctrl', 'shift', 'alt', 'meta']

type KeyedEvent = KeyboardEvent | MouseEvent | TouchEvent

// 事件修饰符列表
const modifierGuards: Record<
  string,
  (e: Event, modifiers: string[]) => void | boolean
> = {
  stop: e => e.stopPropagation(),
  prevent: e => e.preventDefault(),
  self: e => e.target !== e.currentTarget,
  ctrl: e => !(e as KeyedEvent).ctrlKey,
  shift: e => !(e as KeyedEvent).shiftKey,
  alt: e => !(e as KeyedEvent).altKey,
  meta: e => !(e as KeyedEvent).metaKey,
  left: e => 'button' in e && (e as MouseEvent).button !== 0,
  middle: e => 'button' in e && (e as MouseEvent).button !== 1,
  right: e => 'button' in e && (e as MouseEvent).button !== 2,
  exact: (e, modifiers) =>
    systemModifiers.some(m => (e as any)[`${m}Key`] && !modifiers.includes(m))
}

/**
 * @private
 */
// 如 template:
// '<button @click.once.prevent="handleClick" @focus.passive="handleFocus" @mousedown.passive.once.capture="handleMousedown"></button>'
//
// 则渲染code:
//const _Vue = Vue
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { withModifiers: _withModifiers, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return (_openBlock(), _createBlock("button", {
//       onClickOnce: _withModifiers(handleClick, ["prevent"]),
//       onFocusPassive: handleFocus,
//       onMousedownPassiveOnceCapture: handleMousedown
//     }, null, 40 /* PROPS, HYDRATE_EVENTS */, ["onClickOnce", "onFocusPassive", "onMousedownPassiveOnceCapture"]))
//   }
// }
//  添加vue事件修饰符对应的处理逻辑
export const withModifiers = (fn: Function, modifiers: string[]) => {
  return (event: Event, ...args: unknown[]) => {
    // 在执行事件方法前，先执行修饰符对应的逻辑
    for (let i = 0; i < modifiers.length; i++) {
      const guard = modifierGuards[modifiers[i]]
      // 守卫，即只允许触发相应修饰符的逻辑
      // 如 如果点击的不是 'shift' 按键，则不处理后续逻辑
      if (guard && guard(event, modifiers)) return
    }

    // 执行完修饰符处理逻辑，在执行最终方法
    return fn(event, ...args)
  }
}

// Kept for 2.x compat.
// Note: IE11 compat for `spacebar` and `del` is removed for now.
const keyNames: Record<string, string | string[]> = {
  esc: 'escape',
  space: ' ',
  up: 'arrow-up',
  left: 'arrow-left',
  right: 'arrow-right',
  down: 'arrow-down',
  delete: 'backspace'
}

/**
 * @private
 */
export const withKeys = (fn: Function, modifiers: string[]) => {
  let globalKeyCodes: LegacyConfig['keyCodes']
  let instance: ComponentInternalInstance | null = null
  if (__COMPAT__) {
    instance = getCurrentInstance()
    if (
      compatUtils.isCompatEnabled(DeprecationTypes.CONFIG_KEY_CODES, instance)
    ) {
      if (instance) {
        globalKeyCodes = (instance.appContext.config as LegacyConfig).keyCodes
      }
    }
    if (__DEV__ && modifiers.some(m => /^\d+$/.test(m))) {
      compatUtils.warnDeprecation(
        DeprecationTypes.V_ON_KEYCODE_MODIFIER,
        instance
      )
    }
  }

  return (event: KeyboardEvent) => {
    if (!('key' in event)) {
      return
    }

    const eventKey = hyphenate(event.key)
    if (modifiers.some(k => k === eventKey || keyNames[k] === eventKey)) {
      return fn(event)
    }

    if (__COMPAT__) {
      const keyCode = String(event.keyCode)
      if (
        compatUtils.isCompatEnabled(
          DeprecationTypes.V_ON_KEYCODE_MODIFIER,
          instance
        ) &&
        modifiers.some(mod => mod == keyCode)
      ) {
        return fn(event)
      }
      if (globalKeyCodes) {
        for (const mod of modifiers) {
          const codes = globalKeyCodes[mod]
          if (codes) {
            const matches = isArray(codes)
              ? codes.some(code => String(code) === keyCode)
              : String(codes) === keyCode
            if (matches) {
              return fn(event)
            }
          }
        }
      }
    }
  }
}
