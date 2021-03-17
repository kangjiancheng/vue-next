import {
  computed as _computed,
  ComputedRef,
  WritableComputedOptions,
  WritableComputedRef,
  ComputedGetter
} from '@vue/reactivity'
import { recordInstanceBoundEffect } from './component'

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
  const c = _computed(getterOrOptions as any)
  recordInstanceBoundEffect(c.effect)
  return c
}
