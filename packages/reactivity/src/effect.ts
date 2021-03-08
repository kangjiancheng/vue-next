import { TrackOpTypes, TriggerOpTypes } from './operations'
import { EMPTY_OBJ, isArray, isIntegerKey, isMap } from '@vue/shared'

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export interface ReactiveEffect<T = any> {
  (): T
  _isEffect: true
  id: number
  active: boolean
  raw: () => T
  deps: Array<Dep>
  options: ReactiveEffectOptions
  allowRecurse: boolean
}

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: (job: ReactiveEffect) => void
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
  onStop?: () => void
  allowRecurse?: boolean
}

export type DebuggerEvent = {
  effect: ReactiveEffect
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key: any
} & DebuggerEventExtraInfo

export interface DebuggerEventExtraInfo {
  newValue?: any
  oldValue?: any
  oldTarget?: Map<any, any> | Set<any>
}

// effect 栈列
const effectStack: ReactiveEffect[] = []
// 当前激活的 effect
let activeEffect: ReactiveEffect | undefined

export const ITERATE_KEY = Symbol(__DEV__ ? 'iterate' : '')
export const MAP_KEY_ITERATE_KEY = Symbol(__DEV__ ? 'Map key iterate' : '')

export function isEffect(fn: any): fn is ReactiveEffect {
  return fn && fn._isEffect === true
}

export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ
): ReactiveEffect<T> {
  if (isEffect(fn)) {
    // fn._isEffect === true
    fn = fn.raw // 原函数
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect() // 立刻执行
  }
  return effect //
}

export function stop(effect: ReactiveEffect) {
  if (effect.active) {
    cleanup(effect)
    if (effect.options.onStop) {
      effect.options.onStop()
    }
    effect.active = false
  }
}

let uid = 0

/**
 *
 * @param fn
 * @param options：
 *  dev {
      scheduler: queueJob,
      allowRecurse: true,
      onTrack: instance.rtc ? e => invokeArrayFns(instance.rtc!, e) : void 0,
      onTrigger: instance.rtg ? e => invokeArrayFns(instance.rtg!, e) : void 0
    }
 *  prod - {
      scheduler: queueJob,
      // #1801, #2043 component render effects should allow recursive updates
      allowRecurse: true
    }
 */
function createReactiveEffect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions
): ReactiveEffect<T> {
  const effect = function reactiveEffect(): unknown {
    if (!effect.active) {
      // 执行 fn
      return options.scheduler ? undefined : fn()
    }

    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect

        // 执行fn，并返回结果
        return fn()
      } finally {
        // 执行完 fn() 后，停止对当前对effect跟踪
        effectStack.pop()
        resetTracking()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.id = uid++
  effect.allowRecurse = !!options.allowRecurse
  effect._isEffect = true
  effect.active = true
  effect.raw = fn // 保存原函数
  effect.deps = []
  effect.options = options
  return effect
}

// 删除列表中的 effect
function cleanup(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

let shouldTrack = true
const trackStack: boolean[] = []

// 暂停跟踪 vue组件数据状态
export function pauseTracking() {
  trackStack.push(shouldTrack) // 跟踪队列
  shouldTrack = false // 如执行setup函数时，没必要对内部数据状态变化进行跟踪响应
}

// 启动跟踪
export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

// 重置 跟踪状态
export function resetTracking() {
  const last = trackStack.pop() // 如执行完setup函数后，回复对组件数据读取的跟踪
  shouldTrack = last === undefined ? true : last
}

// 跟踪 执行组件渲染函数期间 所调用的数据
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    // 即直接在setup 函数中进行读取时，没必要跟踪
    // 如 let count = ref(1) 然后直接读：console.log(count.value) 这时候，并不是在渲染期间，所以不需要跟踪
    return
  }

  // ref实例，如 ref(1)
  let depsMap = targetMap.get(target) // ref 数据，如 ref(1)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // ref实例中关键属性key， 如 'value'
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 该 关键key 被哪个组件使用
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep) // 该组件使用了哪个key

    if (__DEV__ && activeEffect.options.onTrack) {
      // onTrack: instance.rtc ? e => invokeArrayFns(instance.rtc!, e) : void 0,
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      })
    }
  }
}

export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // never been tracked
    return
  }

  const effects = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || effect.allowRecurse) {
          effects.add(effect)
        }
      })
    }
  }

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add)
  } else if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        add(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      add(depsMap.get(key))
    }

    // also run for iteration key on ADD | DELETE | Map.SET
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        } else if (isIntegerKey(key)) {
          // new index added to array -> length changes
          add(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY))
          if (isMap(target)) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY))
          }
        }
        break
      case TriggerOpTypes.SET:
        if (isMap(target)) {
          add(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  const run = (effect: ReactiveEffect) => {
    if (__DEV__ && effect.options.onTrigger) {
      effect.options.onTrigger({
        effect,
        target,
        key,
        type,
        newValue,
        oldValue,
        oldTarget
      })
    }
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  }

  effects.forEach(run)
}
