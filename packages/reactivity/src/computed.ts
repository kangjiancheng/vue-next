import { type DebuggerOptions, ReactiveEffect } from './effect'
import { type Ref, trackRefValue, triggerRefValue } from './ref'
import { NOOP, hasChanged, isFunction } from '@vue/shared'
import { toRaw } from './reactive'
import type { Dep } from './dep'
import { DirtyLevels, ReactiveFlags } from './constants'
import { warn } from './warning'

declare const ComputedRefSymbol: unique symbol

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: T
  [ComputedRefSymbol]: true
}

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>
}

export type ComputedGetter<T> = (oldValue?: T) => T
export type ComputedSetter<T> = (newValue: T) => void

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>
  set: ComputedSetter<T>
}

export const COMPUTED_SIDE_EFFECT_WARN =
  `Computed is still dirty after getter evaluation,` +
  ` likely because a computed is mutating its own dependency in its getter.` +
  ` State mutations in computed getters should be avoided. ` +
  ` Check the docs for more details: https://vuejs.org/guide/essentials/computed.html#getters-should-be-side-effect-free`

// 创建一个ref对象
export class ComputedRefImpl<T> {
  public dep?: Dep = undefined

  private _value!: T
  public readonly effect: ReactiveEffect<T>

  public readonly __v_isRef = true
  public readonly [ReactiveFlags.IS_READONLY]: boolean = false

  public _cacheable: boolean

  /**
   * Dev only
   */
  _warnRecursive?: boolean

  constructor(
    private getter: ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean, // 仅可读: 传入函数 或 未设置set
    isSSR: boolean,
  ) {
    // 创建effect函数
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () =>
        // 修改值依赖时执行（即修改getter里的响应式依赖数据时，会触发该任务，但不会触发这个value改变，只有在访问时才改变）
        // 脏数据，即只有被修改过，才需要重新执行effect
        triggerRefValue(
          // 触发订阅者effect更新
          this,
          this.effect._dirtyLevel === DirtyLevels.MaybeDirty_ComputedSideEffect
            ? DirtyLevels.MaybeDirty_ComputedSideEffect
            : DirtyLevels.MaybeDirty,
        ),
    )
    this.effect.computed = this
    this.effect.active = this._cacheable = !isSSR
    this[ReactiveFlags.IS_READONLY] = isReadonly // 仅可读: 传入函数 或 未设置set
  }

  get value() {
    // the computed ref may get wrapped by other proxies e.g. readonly() #3376
    const self = toRaw(this)
    const lastDirtyLevel = self.effect._dirtyLevel
    if (
      (!self._cacheable || self.effect.dirty) &&
      hasChanged(self._value, (self._value = self.effect.run()!))
    ) {
      // keep dirty level when side effect computed's value changed
      if (lastDirtyLevel !== DirtyLevels.MaybeDirty_ComputedSideEffect) {
        triggerRefValue(self, DirtyLevels.Dirty)
      }
    }
    trackRefValue(self)
    if (
      self.effect._dirtyLevel >=
      DirtyLevels.MaybeDirty_ComputedSideEffect_Origin
    ) {
      if (__DEV__ && (__TEST__ || this._warnRecursive)) {
        warn(COMPUTED_SIDE_EFFECT_WARN, `\n\ngetter: `, this.getter)
      }
      triggerRefValue(self, DirtyLevels.MaybeDirty_ComputedSideEffect)
    }

    // 需要在effect函数里访问，才会跟踪：渲染函数、watch、computed
    // 如果直接在setup函数里访问这个computed ref数据，不会触发依赖跟踪
    return self._value
  }

  // 不是直接修改当前computed的值，而是修改getter里的依赖数据，如此在下一次访问getter value的值使，可以获取最新依赖值。
  set value(newValue: T) {
    this._setter(newValue)
  }

  // #region polyfill _dirty for backward compatibility third party code for Vue <= 3.3.x
  get _dirty() {
    return this.effect.dirty
  }

  set _dirty(v) {
    this.effect.dirty = v
  }
  // #endregion
}

// 函数：get

/**
 * Takes a getter function and returns a readonly reactive ref object for the
 * returned value from the getter. It can also take an object with get and set
 * functions to create a writable ref object.
 *
 * @example
 * ```js
 * // Creating a readonly computed ref:
 * const count = ref(1)
 * const plusOne = computed(() => count.value + 1)
 *
 * console.log(plusOne.value) // 2
 * plusOne.value++ // error
 * ```
 *
 * ```js
 * // Creating a writable computed ref:
 * const count = ref(1)
 * const plusOne = computed({
 *   get: () => count.value + 1,
 *   set: (val) => {
 *     count.value = val - 1
 *   }
 * })
 *
 * plusOne.value = 1
 * console.log(count.value) // 0
 * ```
 *
 * @param getter - Function that produces the next value.
 * @param debugOptions - For debugging. See {@link https://vuejs.org/guide/extras/reactivity-in-depth.html#computed-debugging}.
 * @see {@link https://vuejs.org/api/reactivity-core.html#computed}
 */
export function computed<T>(
  getter: ComputedGetter<T>,
  debugOptions?: DebuggerOptions,
): ComputedRef<T>
// 对象：get、set
export function computed<T>(
  options: WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions,
): WritableComputedRef<T>
// 实现
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions,
  isSSR = false,
) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>

  const onlyGetter = isFunction(getterOrOptions)
  if (onlyGetter) {
    getter = getterOrOptions
    // 开发环境下，set修改computed值无效
    setter = __DEV__
      ? () => {
          warn('Write operation failed: computed value is readonly')
        }
      : NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter, isSSR) // 仅可读: 传入函数 或 未设置set

  if (__DEV__ && debugOptions && !isSSR) {
    cRef.effect.onTrack = debugOptions.onTrack
    cRef.effect.onTrigger = debugOptions.onTrigger
  }

  return cRef as any
}
