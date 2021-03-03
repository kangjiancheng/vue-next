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
// 如：<hello-world user-name="小明">welcome to home! <template v-slot:header v-if="false">111</template></hello-world>
// render code:
// const _Vue = Vue
// const { createVNode: _createVNode, createTextVNode: _createTextVNode } = _Vue
//
// const _hoisted_1 = /*#__PURE__*/_createTextVNode("welcome to home! ")
// const _hoisted_2 = /*#__PURE__*/_createTextVNode("111")
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createSlots: _createSlots, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     const _component_hello_world = _resolveComponent("hello-world")
//
//     return (_openBlock(), _createBlock(_component_hello_world, { "user-name": "小明" }, _createSlots({
//       default: _withCtx(() => [
//         _hoisted_1
//       ]),
//       _: 2 /* DYNAMIC */
//     }, [
//       false
//         ? {
//             name: "header",
//             fn: _withCtx(() => [
//               _hoisted_2
//             ])
//           }
//         : undefined
//     ]), 1024 /* DYNAMIC_SLOTS */))
//   }
// }
// 封装 fn：保证当执行fn时，fn里的数据能正确访问相应组件中的数据
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
