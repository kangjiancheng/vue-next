import { effect, ReactiveEffect, trigger, track } from './effect'
import { TriggerOpTypes, TrackOpTypes } from './operations'
import { Ref } from './ref'
import { isFunction, NOOP } from '@vue/shared'
import { ReactiveFlags, toRaw } from './reactive'

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
}

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>
}

export type ComputedGetter<T> = (ctx?: any) => T
export type ComputedSetter<T> = (v: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

// 创建一个ref对象
class ComputedRefImpl<T> {
  private _value!: T
  private _dirty = true

  public readonly effect: ReactiveEffect<T>

  public readonly __v_isRef = true;
  public readonly [ReactiveFlags.IS_READONLY]: boolean

  constructor(
    getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean // 仅可读: 传入函数 或 未设置set
  ) {
    // 创建effect函数
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        // 修改值依赖时执行（即修改getter里的响应式依赖数据时，会触发该任务，但不会触发这个value改变，只有在访问时才改变）
        if (!this._dirty) {
          this._dirty = true // 脏数据，即只有被修改过，才需要重新执行effect
          // 触发订阅者effect更新
          trigger(toRaw(this), TriggerOpTypes.SET, 'value')
        }
      }
    })

    this[ReactiveFlags.IS_READONLY] = isReadonly // 仅可读: 传入函数 或 未设置set
  }

  get value() {
    // the computed ref may get wrapped by other proxies e.g. readonly() #3376
    const self = toRaw(this)
    if (self._dirty) {
      // 避免每次访问都需要重新执行getter，只有在依赖数据发生变化时，才重新执行getter
      self._value = this.effect() // 在访问的时候，获取getter里的结果
      self._dirty = false
    }
    // 需要在effect函数里访问，才会跟踪：渲染函数、watch、computed
    // 如果直接在setup函数里访问这个computed ref数据，不会触发依赖跟踪
    track(self, TrackOpTypes.GET, 'value')
    return self._value
  }

  // 不是直接修改当前computed的值，而是修改getter里的依赖数据，如此在下一次访问getter value的值使，可以获取最新依赖值。
  set value(newValue: T) {
    this._setter(newValue)
  }
}

// 函数：get
export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>
// 对象：get、set
export function computed<T>(
  options: WritableComputedOptions<T>
): WritableComputedRef<T>
// 实现
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  if (isFunction(getterOrOptions)) {
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

  return new ComputedRefImpl(
    getter,
    setter,
    isFunction(getterOrOptions) || !getterOrOptions.set // 仅可读: 传入函数 或 未设置set
  ) as any
}
