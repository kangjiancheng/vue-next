import { hyphenate, isArray } from '@vue/shared'
import {
  ComponentInternalInstance,
  callWithAsyncErrorHandling
} from '@vue/runtime-core'
import { ErrorCodes } from 'packages/runtime-core/src/errorHandling'

interface Invoker extends EventListener {
  value: EventValue
  attached: number
}

type EventValue = Function | Function[]

// Async edge case fix requires storing an event listener's attach timestamp.
let _getNow: () => number = Date.now

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
if (
  typeof document !== 'undefined' &&
  _getNow() > document.createEvent('Event').timeStamp
) {
  // if the low-res timestamp which is bigger than the event timestamp
  // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
  // and we need to use the hi-res version for event listeners as well.
  _getNow = () => performance.now()
}

// To avoid the overhead of repeatedly calling performance.now(), we cache
// and use the same timestamp for all event listeners attached in the same tick.
let cachedNow: number = 0
const p = Promise.resolve()
const reset = () => {
  cachedNow = 0
}
const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()))

export function addEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  // https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
  el.addEventListener(event, handler, options)
}

export function removeEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  el.removeEventListener(event, handler, options)
}

// 为vnode dom实例el 添加vue事件属性与事件处理函数
// 如 template: '<button @click.once="handleClick" @focus.prevent.passive="handleFocus"></button>'
// 则渲染函数：
// return (_openBlock(), _createBlock("button", {
//   onClickOnce: handleClick,
//   onFocusPassive: _withModifiers(handleFocus, ["prevent"])
// }, null, 40 /* PROPS, HYDRATE_EVENTS */, ["onClickOnce", "onFocusPassive"]))
export function patchEvent(
  el: Element & { _vei?: Record<string, Invoker | undefined> },
  rawName: string, // vue事件属性名
  prevValue: EventValue | null,
  nextValue: EventValue | null, // 事件属性值，即事件处理函数
  instance: ComponentInternalInstance | null = null // vnode父组件实例，即vnode所在的模版template的组件
) {
  // vue事件，如 @click 则 ，rawName = 'onClick'
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {}) // 事件执行列表
  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    // 事件已存在，更换新事件处理函数
    // patch
    existingInvoker.value = nextValue
  } else {
    // 添加新事件

    // 事件名、事件修饰符：once、passive、capture
    const [name, options] = parseName(rawName)
    if (nextValue) {
      // add 添加事件与事件处理函数
      const invoker = (invokers[rawName] = createInvoker(nextValue, instance)) // 封装事件监听处理器
      addEventListener(el, name, invoker, options)
    } else if (existingInvoker) {
      // 如果只有事件名，没有事件处理函数
      // remove
      removeEventListener(el, name, existingInvoker, options)
      invokers[rawName] = undefined
    }
  }
}

// 事件监听处理器 可选项：https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
// once: 表示 listener 在添加之后最多只调用一次。如果是 true， listener 会在其被调用之后自动移除。
// passive: 设置为true时，表示 listener 永远不会调用 preventDefault()。
// capture: 表示 listener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
const optionsModifierRE = /(?:Once|Passive|Capture)$/

// 获取事件属性名
// 如 template: '<button @click.once="handleClick" @focus.prevent.passive="handleFocus"></button>'
// 则渲染函数：
// return (_openBlock(), _createBlock("button", {
//   onClickOnce: handleClick,
//   onFocusPassive: _withModifiers(handleFocus, ["prevent"])
// }, null, 40 /* PROPS, HYDRATE_EVENTS */, ["onClickOnce", "onFocusPassive"]))
function parseName(name: string): [string, EventListenerOptions | undefined] {
  let options: EventListenerOptions | undefined
  if (optionsModifierRE.test(name)) {
    options = {} // 修饰符列表
    let m
    while ((m = name.match(optionsModifierRE))) {
      name = name.slice(0, name.length - m[0].length) // 截取事件名
      // m[0] 即匹配到的修饰符内容
      ;(options as any)[m[0].toLowerCase()] = true
      options
    }
  }
  // 返回小写的事件属性名，如 'click'
  return [hyphenate(name.slice(2)), options]
}

// 创建vnode节点的一个事件处理监听函数 listener
// https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
function createInvoker(
  initialValue: EventValue, // 事件属性值，即事件处理函数，如 handleClick
  instance: ComponentInternalInstance | null // vnode 所在的组件实例
) {
  const invoker: Invoker = (e: Event) => {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    const timeStamp = e.timeStamp || _getNow() //  Date.now
    if (timeStamp >= invoker.attached - 1) {
      // 执行事件处理函数
      callWithAsyncErrorHandling(
        patchStopImmediatePropagation(e, invoker.value),
        instance,
        ErrorCodes.NATIVE_EVENT_HANDLER,
        [e]
      )
    }
  }
  invoker.value = initialValue // 保存事件处理函数
  invoker.attached = getNow()
  return invoker
}

function patchStopImmediatePropagation(
  e: Event,
  value: EventValue
): EventValue {
  if (isArray(value)) {
    // stopImmediatePropagation：用于取消所有后续事件捕获或事件冒泡，并阻止调用任何后续事件处理程序
    const originalStop = e.stopImmediatePropagation
    e.stopImmediatePropagation = () => {
      originalStop.call(e)
      ;(e as any)._stopped = true
    }
    return value.map(fn => (e: Event) => !(e as any)._stopped && fn(e))
  } else {
    return value
  }
}
