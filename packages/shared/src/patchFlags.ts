/**
 * PatchFlags：vdom diff 编译优化标记，给相应vdom打上相应标记，提高 diff 效率
 * 根据不同标记，在节点更新进行diff计算时，使用不同优化模式，可以更明确地进行 vdom 更新，比如根据CLASS或TEXT只对节点的类名或节点文本内容更新
 * 同时可以组合使用标记 位运算： '|'或者 '&'，表明对这个节点 vdom 要进行多部分更新。
 *
 * @see: https://github.com/vuejs/vue-next/blob/master/packages/shared/src/patchFlags.ts
 *
 * Patch flags can be combined using the | bitwise operator and can be checked
 * using the & operator, e.g.
 *
 * ```js
 * const flag = TEXT | CLASS
 * if (flag & TEXT) { ... }
 * ```
 *
 * Check the `patchElement` function in '../../runtime-core/src/renderer.ts' to see how the
 * flags are handled during diff.
 */

// 可以在 packages/runtime-core/src/renderer.ts 查看这些标志是怎么在diff时被处理的
export const enum PatchFlags {
  // 当检测到节点 文本内容 变更 (children fast path)
  TEXT = 1,

  // 当检测到节点 类名 变更
  CLASS = 1 << 1, // 转换为二进制，左移1位，即二进制尾部添加 1个0，结果为即 2的n次方，n 为 移动数值， 结果：2

  // 当检测到节点 行内样式 变更
  // 在编译前，会先转换为编译所序格式，如：
  //    style="color: red" and :style="{ color: 'red' }"
  //    const style = { color: 'red' }
  //    render() { return e('div', { style }) }
  STYLE = 1 << 2,

  // 当检测到节点 props 变更（不包括class/style）
  // 也可以是一个组件（但包括组件上的class/style）
  // 在编译时，会收集所有变更的props (不包括存在错误的props)
  // 提高 diff 运行效率
  PROPS = 1 << 3,

  // 节点中，对于带有动态key的props，当key发生变化时，总是需要进行完整的差异来删除旧的key
  // 该标志与CLASS、STYLE和PROPS互斥。
  FULL_PROPS = 1 << 4,

  // 检测到节点在服务段绑定的event listeners
  HYDRATE_EVENTS = 1 << 5,

  // 检测到节点子元素顺序未改变时
  STABLE_FRAGMENT = 1 << 6,

  // 检测到代码片段具有key 或 其子元素带有key
  KEYED_FRAGMENT = 1 << 7,

  // 一个片段不包含带有key的子片段
  UNKEYED_FRAGMENT = 1 << 8,

  // 检测一个节点 只需要进行非props的更新，比如 ref 或 directives(onVnodeXXX hooks)
  // 每个标记过的 vnode 都会检查 refs 和 onVnodeXXX 钩子，所以它只是简单地标记 vnode，以便父块跟踪它。
  NEED_PATCH = 1 << 9,

  // Indicates a component with dynamic slots (e.g. slot that references a v-for
  // iterated value, or dynamic slot names).
  // Components with this flag are always force updated.
  // 具有动态插槽的组件，如 v-for渲染的插槽或动态的插槽names
  // 当在diff带有这个标记时，会被强制更新
  DYNAMIC_SLOTS = 1 << 10,

  /**
   * Indicates a fragment that was created only because the user has placed
   * comments at the root level of a template. This is a dev-only flag since
   * comments are stripped in production.
   */
  // 模版根部创建了注释
  DEV_ROOT_FRAGMENT = 1 << 11,

  /*------------------------ 特殊标记：'负整数' -------------------------- */

  // 特殊标记，不会出现在以上位运算中进行匹配，即在进行以上位运算时：patchFlag > 0
  // 因此，对于这些特殊的patchFlag，只是简单的与某个值进行比较：patchFlag === FLAG

  // 对于hoisted static vnode，表明服务端渲染，会跳过其整个子树，因为静态内容不需要更新。
  HOISTED = -1,

  // 跳出 优化模式，比如：
  // 由 renderSlot() 生产的代码片段，当不是通过编译器生成slot（通过编写的渲染函数render()时，应该完全进行diff，不必要进入优化模式，没必要进行某个flag diff）
  // 或者 手动进行的cloneVNodes
  BAIL = -2
}

// dev only flag -> name mapping
// 匹配名字类别
export const PatchFlagNames = {
  [PatchFlags.TEXT]: `TEXT`, // 1
  [PatchFlags.CLASS]: `CLASS`, // 2
  [PatchFlags.STYLE]: `STYLE`, // 4
  [PatchFlags.PROPS]: `PROPS`, // 8
  [PatchFlags.FULL_PROPS]: `FULL_PROPS`, // 16
  [PatchFlags.HYDRATE_EVENTS]: `HYDRATE_EVENTS`, // 32
  [PatchFlags.STABLE_FRAGMENT]: `STABLE_FRAGMENT`, // 64
  [PatchFlags.KEYED_FRAGMENT]: `KEYED_FRAGMENT`, // 128
  [PatchFlags.UNKEYED_FRAGMENT]: `UNKEYED_FRAGMENT`, // 256
  [PatchFlags.NEED_PATCH]: `NEED_PATCH`, // 512
  [PatchFlags.DYNAMIC_SLOTS]: `DYNAMIC_SLOTS`, // 1024
  [PatchFlags.DEV_ROOT_FRAGMENT]: `DEV_ROOT_FRAGMENT`, // 2048
  [PatchFlags.HOISTED]: `HOISTED`, // -1
  [PatchFlags.BAIL]: `BAIL` // -2
}
