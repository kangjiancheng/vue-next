import { DebuggerOptions, ReactiveEffect } from './effect'
import { Ref, trackRefValue, triggerRefValue } from './ref'
import { isFunction, NOOP } from '@vue/shared'
import { ReactiveFlags, toRaw } from './reactive'
import { Dep } from './dep'

declare const ComputedRefSymbol: unique symbol

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
  [ComputedRefSymbol]: true
}

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>
}

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

// 创建一个ref对象
class ComputedRefImpl<T> {
  public dep?: Dep = undefined

  private _value!: T
  private _dirty = true
  public readonly effect: ReactiveEffect<T>

  public readonly __v_isRef = true
  public readonly [ReactiveFlags.IS_READONLY]: boolean

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean // 仅可读: 传入函数 或 未设置set
  ) {
    // 创建effect函数
    this.effect = new ReactiveEffect(getter, () => {
      // 修改值依赖时执行（即修改getter里的响应式依赖数据时，会触发该任务，但不会触发这个value改变，只有在访问时才改变）
      if (!this._dirty) {
        this._dirty = true // 脏数据，即只有被修改过，才需要重新执行effect
        // 触发订阅者effect更新
        triggerRefValue(this)
      }
    })
    this[ReactiveFlags.IS_READONLY] = isReadonly // 仅可读: 传入函数 或 未设置set
  }

  get value() {
    // the computed ref may get wrapped by other proxies e.g. readonly() #3376
    const self = toRaw(this)
    trackRefValue(self)
    if (self._dirty) {
      // 避免每次访问都需要重新执行getter，只有在依赖数据发生变化时，才重新执行getter
      self._dirty = false
      self._value = self.effect.run()! // 在访问的时候，获取getter里的结果
    }

    // 需要在effect函数里访问，才会跟踪：渲染函数、watch、computed
    // 如果直接在setup函数里访问这个computed ref数据，不会触发依赖跟踪
    return self._value
  }

  // 不是直接修改当前computed的值，而是修改getter里的依赖数据，如此在下一次访问getter value的值使，可以获取最新依赖值。
  set value(newValue: T) {
    this._setter(newValue)
  }
}

// 函数：get
export function computed<T>(
  getter: ComputedGetter<T>,
  debugOptions?: DebuggerOptions
): ComputedRef<T>
// 对象：get、set
export function computed<T>(
  options: WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
): WritableComputedRef<T>
// 实现
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    // 开发环境下，set修改computed值无效
    setter = __DEV__
      ? () => {
          console.warn('Write operation failed: computed value is readonly')
        }
      : NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter) // 仅可读: 传入函数 或 未设置set

  if (__DEV__ && debugOptions) {
    cRef.effect.onTrack = debugOptions.onTrack
    cRef.effect.onTrigger = debugOptions.onTrigger
  }

  return cRef as any
}
