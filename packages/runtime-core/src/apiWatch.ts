import {
  effect,
  stop,
  isRef,
  Ref,
  ComputedRef,
  ReactiveEffectOptions,
  isReactive
} from '@vue/reactivity'
import { SchedulerJob, queuePreFlushCb } from './scheduler'
import {
  EMPTY_OBJ,
  isObject,
  isArray,
  isFunction,
  isString,
  hasChanged,
  NOOP,
  remove,
  isMap,
  isSet
} from '@vue/shared'
import {
  currentInstance,
  ComponentInternalInstance,
  isInSSRComponentSetup,
  recordInstanceBoundEffect
} from './component'
import {
  ErrorCodes,
  callWithErrorHandling,
  callWithAsyncErrorHandling
} from './errorHandling'
import { queuePostRenderEffect } from './renderer'
import { warn } from './warning'

export type WatchEffect = (onInvalidate: InvalidateCbRegistrator) => void

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T)

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  onInvalidate: InvalidateCbRegistrator
) => any

type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true ? (V | undefined) : V
    : T[K] extends object
      ? Immediate extends true ? (T[K] | undefined) : T[K]
      : never
}

type InvalidateCbRegistrator = (cb: () => void) => void

export interface WatchOptionsBase {
  flush?: 'pre' | 'post' | 'sync'
  onTrack?: ReactiveEffectOptions['onTrack']
  onTrigger?: ReactiveEffectOptions['onTrigger']
}

export interface WatchOptions<Immediate = boolean> extends WatchOptionsBase {
  immediate?: Immediate
  deep?: boolean
}

export type WatchStopHandle = () => void

// Simple effect.
export function watchEffect(
  effect: WatchEffect,
  options?: WatchOptionsBase
): WatchStopHandle {
  return doWatch(effect, null, options)
}

// initial value for watchers to trigger on undefined initial values
const INITIAL_WATCHER_VALUE = {}

type MultiWatchSources = (WatchSource<unknown> | object)[]

// overload: array of multiple sources + cb
export function watch<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// overload: multiple sources w/ `as const`
// watch([foo, bar] as const, () => {})
// somehow [...T] breaks when the type is readonly
export function watch<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// overload: single source + cb
export function watch<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? (T | undefined) : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// overload: watching reactive object w/ cb
export function watch<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? (T | undefined) : T>,
  options?: WatchOptions<Immediate>
): WatchStopHandle

// implementation
export function watch<T = any, Immediate extends Readonly<boolean> = false>(
  source: T | WatchSource<T>,
  cb: any,
  options?: WatchOptions<Immediate>
): WatchStopHandle {
  if (__DEV__ && !isFunction(cb)) {
    warn(
      `\`watch(fn, options?)\` signature has been moved to a separate API. ` +
        `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
        `supports \`watch(source, cb, options?) signature.`
    )
  }
  // 初始化：执行source的effect，track 进行监听目标依赖项 收集与跟踪
  // 更新时：触发依赖目标，trigger 组件或watch更新

  // immediate: true - 依赖收集后，执行回调函数；false - 只进行依赖收集
  return doWatch(source as any, cb, options)
}

function doWatch(
  source: WatchSource | WatchSource[] | WatchEffect | object,
  cb: WatchCallback | null,
  { immediate, deep, flush, onTrack, onTrigger }: WatchOptions = EMPTY_OBJ,
  instance = currentInstance // 在执行组件的setup函数期间，会执行watch，所以instance为当前组件实例
): WatchStopHandle {
  if (__DEV__ && !cb) {
    // 当使用：watchEffect(effect, options)，immediate、deep 就不需要了

    if (immediate !== undefined) {
      // 仅适用于 watch()
      warn(
        `watch() "immediate" option is only respected when using the ` +
          `watch(source, callback, options?) signature.`
      )
    }
    if (deep !== undefined) {
      // 仅适用于 watch()
      warn(
        `watch() "deep" option is only respected when using the ` +
          `watch(source, callback, options?) signature.`
      )
    }
  }

  // 校验监听目标：ref、reactive对象 或 包含这类对象当数组
  const warnInvalidSource = (s: unknown) => {
    warn(
      `Invalid watch source: `,
      s,
      `A watch source can only be a getter/effect function, a ref, ` +
        `a reactive object, or an array of these types.`
    )
  }

  let getter: () => any // ref、reactive、数组、getter => ...
  let forceTrigger = false
  if (isRef(source)) {
    // ref 引用 __v_isRef
    getter = () => (source as Ref).value // 访问时，依赖项value被跟踪
    forceTrigger = !!(source as Ref)._shallow
  } else if (isReactive(source)) {
    // reactive 响应对象 __v_isReactive
    getter = () => source
    deep = true
  } else if (isArray(source)) {
    // 数组 转换为 getter函数
    getter = () =>
      source.map(s => {
        if (isRef(s)) {
          return s.value
        } else if (isReactive(s)) {
          return traverse(s) // 遍历访问所有数据，为了响应式依赖收集
        } else if (isFunction(s)) {
          return callWithErrorHandling(s, instance, ErrorCodes.WATCH_GETTER, [
            instance && (instance.proxy as any)
          ])
        } else {
          __DEV__ && warnInvalidSource(s)
        }
      })
  } else if (isFunction(source)) {
    if (cb) {
      // getter with cb
      getter = () =>
        callWithErrorHandling(source, instance, ErrorCodes.WATCH_GETTER, [
          instance && (instance.proxy as any)
        ])
    } else {
      // no cb -> simple effect
      getter = () => {
        if (instance && instance.isUnmounted) {
          return
        }
        if (cleanup) {
          cleanup()
        }
        return callWithErrorHandling(
          source, // getter
          instance,
          ErrorCodes.WATCH_CALLBACK,
          [onInvalidate]
        )
      }
    }
  } else {
    getter = NOOP
    __DEV__ && warnInvalidSource(source)
  }

  // 深层次响应式依赖收集
  if (cb && deep) {
    const baseGetter = getter
    // 执行watch监听目标的effect函数即该getter函数时，遍历访问数据，并进行依赖收集
    getter = () => traverse(baseGetter())
  }

  let cleanup: () => void
  const onInvalidate: InvalidateCbRegistrator = (fn: () => void) => {
    cleanup = runner.options.onStop = () => {
      callWithErrorHandling(fn, instance, ErrorCodes.WATCH_CLEANUP)
    }
  }

  // in SSR there is no need to setup an actual effect, and it should be noop
  // unless it's eager
  if (__NODE_JS__ && isInSSRComponentSetup) {
    if (!cb) {
      getter()
    } else if (immediate) {
      callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
        getter(),
        undefined,
        onInvalidate
      ])
    }
    return NOOP
  }

  // 记录 old value
  let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE // {}

  // 执行runner
  const job: SchedulerJob = () => {
    if (!runner.active) {
      return
    }
    if (cb) {
      // watch(source, cb)
      const newValue = runner() // 执行source的effect函数 - 对监听目标进行依赖跟踪与收集
      if (deep || forceTrigger || hasChanged(newValue, oldValue)) {
        // cleanup before running cb again
        if (cleanup) {
          cleanup() // 下一次更新回调函数之前，会再触发一次回调函数
        }
        // 执行 watch cb 回调函数
        callWithAsyncErrorHandling(cb, instance, ErrorCodes.WATCH_CALLBACK, [
          newValue,
          // pass undefined as the old value when it's changed for the first time
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue, // 首次改变时
          onInvalidate // 当执行监听目标getter的effect函数时，调用effect stop事件时
        ])
        oldValue = newValue // 执行完回调后，该值变为旧值，为下一次更新做准备
      }
    } else {
      // watchEffect
      runner()
    }
  }

  // important: mark the job as a watcher callback so that scheduler knows
  // it is allowed to self-trigger (#1727)
  job.allowRecurse = !!cb

  // 任务调度机：修改watch监听目标值时，trigger触发更新任务列表
  let scheduler: ReactiveEffectOptions['scheduler']
  if (flush === 'sync') {
    scheduler = job // 同步执行：当监听目标值改变时，立刻执行
  } else if (flush === 'post') {
    // 更新时：同步任务后，在组件执行渲染函数effect任务之后
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense)
  } else {
    // default: 'pre' // 更新组件时：同步任务后，在执行组件渲染函数effect任务之前，触发watch
    scheduler = () => {
      if (!instance || instance.isMounted) {
        // 组件已挂载，更新监听目标依赖项
        // 放到promise.then里前边执行
        queuePreFlushCb(job)
      } else {
        // 首次挂载组件时，默认先执行该组件setup中watch目标的effect函数，之后在执行组件渲染函数的effect函数
        // with 'pre' option, the first call must happen before
        // the component is mounted so it is called synchronously.
        job()
      }
    }
  }

  // 创建监听目标getter的effect函数 - runner
  // 当执行effect函数时，会开启对 getter函数里的依赖项 进行跟踪与收集
  const runner = effect(getter, {
    lazy: true, // 不马上执行getter，只返回getter的effect函数
    onTrack,
    onTrigger,
    scheduler // 修改getter值时，在trigger中触发更新订阅目标cb
  })

  // 记录组件执行setup期间，组件实例所依赖的effect函数
  recordInstanceBoundEffect(runner, instance)

  // initial run
  if (cb) {
    if (immediate) {
      job() // 立刻执行任务job，执行其中watch cb回调函数
    } else {
      oldValue = runner() // 一开始只记录旧值：在之后 触发更新值时，执行job时，会进行比较
    }
  } else if (flush === 'post') {
    queuePostRenderEffect(runner, instance && instance.suspense)
  } else {
    runner()
  }

  // 返回一个可以停止监听的函数
  return () => {
    stop(runner) // 停止active，并在此effect的依赖列表中deps - 移除 对此监听目标依赖项数据 的该依赖effect
    if (instance) {
      remove(instance.effects!, runner)
    }
  }
}

// this.$watch
export function instanceWatch(
  this: ComponentInternalInstance,
  source: string | Function,
  cb: WatchCallback,
  options?: WatchOptions
): WatchStopHandle {
  const publicThis = this.proxy as any
  const getter = isString(source)
    ? () => publicThis[source]
    : source.bind(publicThis)
  return doWatch(getter, cb.bind(publicThis), options, this)
}

// 遍历访问数据，并进行依赖收集
function traverse(value: unknown, seen: Set<unknown> = new Set()) {
  if (!isObject(value) || seen.has(value)) {
    return value
  }
  seen.add(value)
  if (isRef(value)) {
    // ref 引用
    traverse(value.value, seen)
  } else if (isArray(value)) {
    // Array 数组
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen)
    }
  } else if (isSet(value) || isMap(value)) {
    // Set集合、Map字典
    value.forEach((v: any) => {
      traverse(v, seen)
    })
  } else {
    // 默认对象
    for (const key in value) {
      traverse(value[key], seen)
    }
  }
  return value
}
