import { TrackOpTypes, TriggerOpTypes } from './operations'
import { EMPTY_OBJ, isArray, isIntegerKey, isMap } from '@vue/shared'

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>() // 保存响应式ref数据对象 -> 响应式数据对象key -> 依赖的组件effect集合

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

  // queueJob - Job
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect() // 立刻执行
  }
  return effect
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
  // 组件更新数据时，也会重新执行这个effect，即 SchedulerJob
  const effect = function reactiveEffect(): unknown {
    if (!effect.active) {
      // 执行 fn
      return options.scheduler ? undefined : fn()
    }

    if (!effectStack.includes(effect)) {
      cleanup(effect) // 删除已经存在的effect，避免之后重复添加，如更新组件响应式依赖数据时 更新组件effect
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect // 当前正在渲染的组件 - effect

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
  effect.allowRecurse = !!options.allowRecurse // true
  effect._isEffect = true
  effect.active = true
  effect.raw = fn // 当前正在执行渲染函数
  effect.deps = [] // 组件每个响应式数据 所依赖到的组件effect集合
  effect.options = options
  return effect
}

// 删除已经存在的effect，避免之后重复添加，如更新组件响应式依赖数据时 发生的执行更新组件effect期间
function cleanup(effect: ReactiveEffect) {
  const { deps } = effect
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      // 遍历删除当前组件所有属性 对当前组件的依赖，为了之后执行渲染函数时重新添加响应依赖
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

let shouldTrack = true // 默认需要跟踪
const trackStack: boolean[] = []

// 暂停跟踪 vue组件数据状态
export function pauseTracking() {
  trackStack.push(shouldTrack) // 跟踪队列
  shouldTrack = false // 如执行setup函数时，没必要对ctx内部数据状态变化进行跟踪响应
}

// 启动跟踪
export function enableTracking() {
  trackStack.push(shouldTrack)
  shouldTrack = true
}

// 恢复跟踪状态
export function resetTracking() {
  const last = trackStack.pop() // 如执行完setup函数后，回复对组件数据读取的跟踪
  shouldTrack = last === undefined ? true : last //默认跟踪
}

// 跟踪某个响应对象的某个属性 所依赖的组件effect（执行组件渲染函数期间）
// 如 const count = ref(1); track(toRaw(count), TrackOpTypes.GET, 'value')
export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    // 即直接在setup 函数中进行读取时，没必要跟踪
    // 如 let count = ref(1) 然后直接读：console.log(count.value) 这时候，并不是在渲染期间，所以不需要跟踪
    return
  }

  // targetMap: {
  //    target - 响应式对象: {
  //        key - 响应式对象属性: [
  //          dep - 响应式对象属性 所依赖的组件effect
  //        ]
  //    }
  // }

  // 收集响应式对象，如 响应式ref对象 const = count=ref(1)
  let depsMap = targetMap.get(target) // ref 数据，如 ref(1)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 收集响应式对象 实际被依赖的属性（如ref对象的value属性）
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  // 收集组件effect - 组件在渲染期间 使用了该响应式ref对象属性value
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep) // 组件effect依赖此响应式对象的这个属性

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

// 触发key 对应的 依赖的组件effect列表更新 deps
export function trigger(
  target: object, // 修改的对象
  type: TriggerOpTypes, // 触发方式 如 set 改值
  key?: unknown, // 修改的对象的key
  newValue?: unknown, // key: value
  oldValue?: unknown,
  oldTarget?: Map<unknown, unknown> | Set<unknown>
) {
  // depsMap: 响应式对象 所有被依赖收集的属性集合
  const depsMap = targetMap.get(target) // 响应式依赖
  if (!depsMap) {
    // never been tracked
    // target 没有被响应式依赖收集
    return
  }

  // 收集当前key 所依赖的组件effects
  const effects = new Set<ReactiveEffect>()
  const add = (effectsToAdd: Set<ReactiveEffect> | undefined) => {
    // effectsToAdd - key 所对应的组件effects列表
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        if (effect !== activeEffect || effect.allowRecurse) {
          // allowRecurse: true
          effects.add(effect)
        }
      })
    }
  }

  if (type === TriggerOpTypes.CLEAR) {
    // 集合清空
    // collection being cleared
    // trigger all effects for target
    depsMap.forEach(add)
  } else if (key === 'length' && isArray(target)) {
    // 数组清空
    depsMap.forEach((dep, key) => {
      if (key === 'length' || key >= (newValue as number)) {
        add(dep)
      }
    })
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      // deps: 属性key 所依赖的组件effect列表
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
          // 集合
          add(depsMap.get(ITERATE_KEY))
        }
        break
    }
  }

  // 依次触发key所依赖组件effect列表更新
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
      // queueJob
      effect.options.scheduler(effect) // 执行组件effect
    } else {
      effect()
    }
  }

  effects.forEach(run)
}
