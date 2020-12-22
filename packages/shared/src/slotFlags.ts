// 在解析v-slot指令过程中

export const enum SlotFlags {
  /**
   * Stable slots that only reference slot props or context state. The slot
   * can fully capture its own dependencies so when passed down the parent won't
   * need to force the child to update.
   */
  STABLE = 1, // 静态slot下， 节点的子孙元素中不存在元素标签为 slot
  /**
   * Slots that reference scope variables (v-for or an outer slot prop), or
   * has conditional structure (v-if, v-for). The parent will need to force
   * the child to update because the slot does not fully capture its dependencies.
   */
  DYNAMIC = 2, // 动态的slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
  /**
   * `<slot/>` being forwarded into a child component. Whether the parent needs
   * to update the child is dependent on what kind of slots the parent itself
   * received. This has to be refined at runtime, when the child's vnode
   * is being created (in `normalizeChildren`)
   */
  FORWARDED = 3 // 静态slot下， 节点的子孙元素中存在元素标签为 slot
}

/**
 * Dev only
 */
export const slotFlagsText = {
  [SlotFlags.STABLE]: 'STABLE',
  [SlotFlags.DYNAMIC]: 'DYNAMIC',
  [SlotFlags.FORWARDED]: 'FORWARDED'
}
