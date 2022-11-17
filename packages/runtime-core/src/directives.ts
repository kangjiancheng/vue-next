/**
Runtime helper for applying directives to a vnode. Example usage:

const comp = resolveComponent('comp')
const foo = resolveDirective('foo')
const bar = resolveDirective('bar')

return withDirectives(h(comp), [
  [foo, this.x],
  [bar, this.y]
])
*/

import { VNode } from './vnode'
import { isFunction, EMPTY_OBJ, isBuiltInDirective } from '@vue/shared'
import { warn } from './warning'
import { ComponentInternalInstance, Data, getExposeProxy } from './component'
import { currentRenderingInstance } from './componentRenderContext'
import { callWithAsyncErrorHandling, ErrorCodes } from './errorHandling'
import { ComponentPublicInstance } from './componentPublicInstance'
import { mapCompatDirectiveHook } from './compat/customDirective'
import { pauseTracking, resetTracking } from '@vue/reactivity'
import { traverse } from './apiWatch'

export interface DirectiveBinding<V = any> {
  instance: ComponentPublicInstance | null
  value: V
  oldValue: V | null
  arg?: string
  modifiers: DirectiveModifiers
  dir: ObjectDirective<any, V>
}

export type DirectiveHook<T = any, Prev = VNode<any, T> | null, V = any> = (
  el: T,
  binding: DirectiveBinding<V>,
  vnode: VNode<any, T>,
  prevVNode: Prev
) => void

export type SSRDirectiveHook = (
  binding: DirectiveBinding,
  vnode: VNode
) => Data | undefined

export interface ObjectDirective<T = any, V = any> {
  created?: DirectiveHook<T, null, V>
  beforeMount?: DirectiveHook<T, null, V>
  mounted?: DirectiveHook<T, null, V>
  beforeUpdate?: DirectiveHook<T, VNode<any, T>, V>
  updated?: DirectiveHook<T, VNode<any, T>, V>
  beforeUnmount?: DirectiveHook<T, null, V>
  unmounted?: DirectiveHook<T, null, V>
  getSSRProps?: SSRDirectiveHook
  deep?: boolean
}

export type FunctionDirective<T = any, V = any> = DirectiveHook<T, any, V>

export type Directive<T = any, V = any> =
  | ObjectDirective<T, V>
  | FunctionDirective<T, V>

export type DirectiveModifiers = Record<string, boolean>

export function validateDirectiveName(name: string) {
  if (isBuiltInDirective(name)) {
    warn('Do not use built-in directive ids as custom directive id: ' + name)
  }
}

// Directive, value, argument, modifiers
export type DirectiveArguments = Array<
  | [Directive | undefined]
  | [Directive | undefined, any]
  | [Directive | undefined, any, string]
  | [Directive | undefined, any, string, DirectiveModifiers]
>

/**
 * Adds directives to a VNode.
 */
// 如 组件模版template: '<div class="my-directive" v-resize:editor.lazy="handleResizeEditor">自定义指令</div>'
// 则 渲染code:
// const _Vue = Vue
// const { createVNode: _createVNode } = _Vue
//
// const _hoisted_1 = { class: "my-directive" }
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { resolveDirective: _resolveDirective, createVNode: _createVNode, withDirectives: _withDirectives, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     const _directive_resize = _resolveDirective("resize")  // 获取指令对象内容
//
//     return _withDirectives((_openBlock(), _createBlock("div", _hoisted_1, "自定义指令", 512 /* NEED_PATCH */)), [
//       [
//         _directive_resize,
//         handleResizeEditor,
//         "editor",
//         { lazy: true }
//       ]
//     ])
//   }
// }
// 为渲染节点vnode添加指令列表dirs
export function withDirectives<T extends VNode>(
  vnode: T, // 渲染节点vnode
  directives: DirectiveArguments // 指令参数列表
): T {
  const internalInstance = currentRenderingInstance // 组件渲染节点实例
  if (internalInstance === null) {
    __DEV__ && warn(`withDirectives can only be used inside render functions.`)
    return vnode
  }
  const instance =
    (getExposeProxy(internalInstance) as ComponentPublicInstance) ||
    internalInstance.proxy // （父）组件实例ctx
  const bindings: DirectiveBinding[] = vnode.dirs || (vnode.dirs = [])
  for (let i = 0; i < directives.length; i++) {
    // 指令内容、指令属性值、指令属性参数、指令属性修饰符
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i]
    if (dir) {
      if (isFunction(dir)) {
        // 函数指令
        dir = {
          mounted: dir,
          updated: dir
        } as ObjectDirective
      }
      if (dir.deep) {
        traverse(value)
      }
      bindings.push({
        dir, // 指令内容 - 即组件指令属性列表里的 指令对象
        instance, // （父）组件实例
        value, // 指令属性值
        oldValue: void 0, // vnode的旧指令
        arg, // 指令参数
        modifiers // 指令修饰符
      })
    }
  }
  return vnode
}

// 执行 自定义指令hook：在解析挂载vnode实例时，会解析vnode dirs
export function invokeDirectiveHook(
  vnode: VNode,
  prevVNode: VNode | null,
  instance: ComponentInternalInstance | null, // vnode 父组件节点实例
  name: keyof ObjectDirective // 指令hook：created、
) {
  const bindings = vnode.dirs!
  const oldBindings = prevVNode && prevVNode.dirs!
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i]
    if (oldBindings) {
      // 保存旧指令
      binding.oldValue = oldBindings[i].value
    }
    // 自定义指令hook方法：
    // created： vnode 刚创建对应dom实例el包括其子元素列表后，解析vnode指令：在render中的阶段 - mountElement()
    // beforeMount：vnode el节点属性props已添加完成
    // mounted：vnode el已挂载到相应父节点dom实例上（如根vnode 挂载到#app dom，子vnode挂载到父vnode的dom实例上）
    // beforeUpdate： vnode 更新之前 - props 更新之前
    // updated： vnode 更新后 - props、children 更新完后
    // beforeUnmount
    // unmounted
    let hook = binding.dir[name] as DirectiveHook | DirectiveHook[] | undefined
    if (__COMPAT__ && !hook) {
      hook = mapCompatDirectiveHook(name, binding.dir, instance)
    }
    if (hook) {
      // disable tracking inside all lifecycle hooks
      // since they can potentially be called inside effects.
      pauseTracking()
      callWithAsyncErrorHandling(hook, instance, ErrorCodes.DIRECTIVE_HOOK, [
        vnode.el, // vnode el 实例
        binding, // vnode 指令节点（包括：指令对象、指令属性值、指令属性参数、指令属性修饰符）
        vnode, // vnode 节点
        prevVNode // 旧vnode
      ])
      resetTracking()
    }
  }
}
