import { Slot } from '../componentSlots'
import {
  setCurrentRenderingInstance,
  currentRenderingInstance
} from '../componentRenderUtils'
import { ComponentInternalInstance } from '../component'
import { isRenderingCompiledSlot } from './renderSlot'
import { closeBlock, openBlock } from '../vnode'

/**
 * Wrap a slot function to memoize current rendering instance
 * @private
 */
// 组件节点：
// '<hello-world>
//    <template v-slot:default="slotProps">{{ slotProps.text }}</template>
//  </hello-world>'
// 组件节点 渲染源码code:
// const _component_hello_world = _resolveComponent("hello-world")
//
//     return (_openBlock(), _createBlock(_component_hello_world, null, {
//       default: _withCtx((slotProps) => [
//         _createTextVNode(_toDisplayString(slotProps.text), 1 /* TEXT */)
//       ]),
//       _: 1 /* STABLE */
//     }))
//
// 组件模版：
// 如：'<div class="hello-world">
//       <slot :text="'this is default'"></slot>
//       <slot name="header"></slot>
//     </div>'
// 组件模版 渲染源码code：
//  _createBlock("div", _hoisted_1, [
//    _renderSlot($slots, "default", { text: 'this is default' }),
//    _renderSlot($slots, "header")
//  ])
// 封装 fn：保证当执行fn时，fn里的数据能正确访问相应组件中的数据
// 因为该vnode没有马上创建，而是之后在触发。
export function withCtx(
  fn: Slot,
  ctx: ComponentInternalInstance | null = currentRenderingInstance // 当前组件实例
) {
  if (!ctx) return fn
  const renderFnWithContext = (...args: any[]) => {
    // If a user calls a compiled slot inside a template expression (#1745), it
    // can mess up block tracking, so by default we need to push a null block to
    // avoid that. This isn't necessary if rendering a compiled `<slot>`.
    if (!isRenderingCompiledSlot) {
      openBlock(true /* null block that disables tracking */)
    }
    // 当前slot节点属于哪个组件
    const owner = currentRenderingInstance
    // 当在组件模版中执行生成这个slot节点时，需要恢复到原先的父组件实例
    setCurrentRenderingInstance(ctx)
    const res = fn(...args)
    setCurrentRenderingInstance(owner)
    if (!isRenderingCompiledSlot) {
      closeBlock()
    }
    return res
  }
  renderFnWithContext._c = true

  return renderFnWithContext
}
