import {
  ComponentInternalInstance,
  currentInstance,
  isInSSRComponentSetup,
  LifecycleHooks,
  setCurrentInstance
} from './component'
import { ComponentPublicInstance } from './componentPublicInstance'
import { callWithAsyncErrorHandling, ErrorTypeStrings } from './errorHandling'
import { warn } from './warning'
import { toHandlerKey } from '@vue/shared'
import { DebuggerEvent, pauseTracking, resetTracking } from '@vue/reactivity'

export { onActivated, onDeactivated } from './components/KeepAlive'

// 如：在执行setup函数时，向vue组件实例 添加 生命周期函数 onMounted
export function injectHook(
  type: LifecycleHooks,
  hook: Function & { __weh?: Function }, // 生命周期回调函数（即用户传递的钩子函数）
  target: ComponentInternalInstance | null = currentInstance,
  prepend: boolean = false
): Function | undefined {
  if (target) {
    // hooks 即组件实例上的周期函数
    const hooks = target[type] || (target[type] = [])
    // cache the error handling wrapper for injected hooks so the same hook
    // can be properly deduped by the scheduler. "__weh" stands for "with error
    // handling".
    const wrappedHook = // 封装用户定义的生命周期回调函数
      hook.__weh ||
      (hook.__weh = (...args: unknown[]) => {
        // 执行生命周期函数，如：在组件dom实例挂载到父容器dom上后，执行onMounted周期函数

        if (target.isUnmounted) {
          return
        }
        // disable tracking inside all lifecycle hooks
        // since they can potentially be called inside effects.
        pauseTracking()
        // Set currentInstance during hook invocation.
        // This assumes the hook does not synchronously trigger other hooks, which
        // can only be false when the user does something really funky.
        setCurrentInstance(target)
        const res = callWithAsyncErrorHandling(hook, target, type, args) // 开始执行生命周期函数
        setCurrentInstance(null)
        resetTracking()
        return res
      })
    if (prepend) {
      hooks.unshift(wrappedHook)
    } else {
      hooks.push(wrappedHook)
    }
    return wrappedHook // 用户的生命周期函数返回值
  } else if (__DEV__) {
    const apiName = toHandlerKey(ErrorTypeStrings[type].replace(/ hook$/, ''))
    warn(
      `${apiName} is called when there is no active component instance to be ` +
        `associated with. ` +
        `Lifecycle injection APIs can only be used during execution of setup().` +
        (__FEATURE_SUSPENSE__
          ? ` If you are using async setup(), make sure to register lifecycle ` +
            `hooks before the first await statement.`
          : ``)
    )
  }
}

// 创建生命周期函数
export const createHook = <T extends Function = () => any>(
  lifecycle: LifecycleHooks
) => (
  hook: T,
  target: ComponentInternalInstance | null = currentInstance // currentInstance 当前组件实例
) =>
  // post-create lifecycle registrations are noops during SSR
  !isInSSRComponentSetup && injectHook(lifecycle, hook, target) // 向组件实例添加生命周期函数

// 执行组件的渲染函数之前
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT) // bm

// 挂载组件节点vnode el（即组件模版template vnode el）到父容器dom上：
//    即执行组件的渲染模版函数 生成渲染模版 vnode，
//    然后生成 vnode对应的el dom实例节点（包括其子节点），
//    并挂载到父节点容器上，且确定了组件vnode节点的el 后。
export const onMounted = createHook(LifecycleHooks.MOUNTED) // m

export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE) // bu
export const onUpdated = createHook(LifecycleHooks.UPDATED) // u
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT) // bum
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED) // um

export type DebuggerHook = (e: DebuggerEvent) => void
export const onRenderTriggered = createHook<DebuggerHook>(
  LifecycleHooks.RENDER_TRIGGERED
)
export const onRenderTracked = createHook<DebuggerHook>(
  LifecycleHooks.RENDER_TRACKED
)

export type ErrorCapturedHook = (
  err: unknown,
  instance: ComponentPublicInstance | null,
  info: string
) => boolean | void

export const onErrorCaptured = (
  hook: ErrorCapturedHook,
  target: ComponentInternalInstance | null = currentInstance
) => {
  injectHook(LifecycleHooks.ERROR_CAPTURED, hook, target)
}
