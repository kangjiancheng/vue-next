import {
  ElementNode,
  ObjectExpression,
  createObjectExpression,
  NodeTypes,
  createObjectProperty,
  createSimpleExpression,
  createFunctionExpression,
  DirectiveNode,
  ElementTypes,
  ExpressionNode,
  Property,
  TemplateChildNode,
  SourceLocation,
  createConditionalExpression,
  ConditionalExpression,
  SimpleExpressionNode,
  FunctionExpression,
  CallExpression,
  createCallExpression,
  createArrayExpression,
  SlotsExpression
} from '../ast'
import { TransformContext, NodeTransform } from '../transform'
import { createCompilerError, ErrorCodes } from '../errors'
import {
  findDir,
  isTemplateNode,
  assert,
  isVSlot,
  hasScopeRef,
  isStaticExp
} from '../utils'
import { CREATE_SLOTS, RENDER_LIST, WITH_CTX } from '../runtimeHelpers'
import { parseForExpression, createForLoopParams } from './vFor'
import { SlotFlags, slotFlagsText } from '@vue/shared'

const defaultFallback = createSimpleExpression(`undefined`, false) // type: NodeTypes.SIMPLE_EXPRESSION,

// 如 template: '<slot-demo v-slot:test>v-slot test</slot-demo>'
// 组件 SlotDemo template: '<div class="slot-demo"><slot name="test"></slot></div>'

// A NodeTransform that:
// 1. Tracks scope identifiers for scoped slots so that they don't get prefixed
//    by transformExpression. This is only applied in non-browser builds with
//    { prefixIdentifiers: true }.
// 2. Track v-slot depths so that we know a slot is inside another slot.
//    Note the exit callback is executed before buildSlots() on the same node,
//    so only nested slots see positive numbers.
export const trackSlotScopes: NodeTransform = (node, context) => {
  if (
    node.type === NodeTypes.ELEMENT &&
    (node.tagType === ElementTypes.COMPONENT ||
      node.tagType === ElementTypes.TEMPLATE)
  ) {
    // We are only checking non-empty v-slot here
    // since we only care about slots that introduce scope variables.

    // 处理带有slot指令的元素节点
    // 查找指令属性节点，并返回指令属性节点
    const vSlot = findDir(node, 'slot')

    // 之后会在transformElement 中分析属性props列表时，进一步处理
    if (vSlot) {
      const slotProps = vSlot.exp // 指令属性值内容节点
      if (!__BROWSER__ && context.prefixIdentifiers) {
        slotProps && context.addIdentifiers(slotProps)
      }
      context.scopes.vSlot++ // 通过数量来判断是否包含在另一个slot里面
      return () => {
        if (!__BROWSER__ && context.prefixIdentifiers) {
          slotProps && context.removeIdentifiers(slotProps)
        }
        context.scopes.vSlot--
      }
    }
  }
}

// A NodeTransform that tracks scope identifiers for scoped slots with v-for.
// This transform is only applied in non-browser builds with { prefixIdentifiers: true }
export const trackVForSlotScopes: NodeTransform = (node, context) => {
  let vFor
  if (
    isTemplateNode(node) &&
    node.props.some(isVSlot) &&
    (vFor = findDir(node, 'for'))
  ) {
    const result = (vFor.parseResult = parseForExpression(
      vFor.exp as SimpleExpressionNode,
      context
    ))
    if (result) {
      const { value, key, index } = result
      const { addIdentifiers, removeIdentifiers } = context
      value && addIdentifiers(value)
      key && addIdentifiers(key)
      index && addIdentifiers(index)

      return () => {
        value && removeIdentifiers(value)
        key && removeIdentifiers(key)
        index && removeIdentifiers(index)
      }
    }
  }
}

export type SlotFnBuilder = (
  slotProps: ExpressionNode | undefined,
  slotChildren: TemplateChildNode[],
  loc: SourceLocation
) => FunctionExpression

/**
 * 创建组件子元素的slot节点值 即子元素的js ast codegen节点
 * @param props - 子元素的属性列表
 * @param children - 子元素的子元素列表
 * @param loc - 子元素源码位置
 */
const buildClientSlotFn: SlotFnBuilder = (props, children, loc) =>
  createFunctionExpression(
    // JS_FUNCTION_EXPRESSION
    props, // params 参数
    children, //  returns 返回值
    false /* newline */,
    true /* isSlot */, // 创建slot 函数
    children.length ? children[0].loc : loc
  )

// 创建组件及子元素的slot节点列表
// Instead of being a DirectiveTransform, v-slot processing is called during
// transformElement to build the slots object for a component.
export function buildSlots(
  node: ElementNode, // 组件节点，不包括组件： TELEPORT、KEEP_ALIVE
  context: TransformContext,
  buildSlotFn: SlotFnBuilder = buildClientSlotFn // 创建slot节点的值，即该子元素的codegen节点
): {
  slots: SlotsExpression // slot模版节点信息替换子节点列表，如：当前节点的v-slot; 当前节点下如果都没有slot模版，保存所有子元素为默认slot; 不存在默认slot模版时，保存非slot模版子元素为默认slot; 保存slotFlag相关信息； 动态的v-if/v-for的 dynamicSlots
  hasDynamicSlots: boolean // 动态的slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
} {
  // 组件子元素的slot节点上下文，如默认slot的 default: _withCtx((slotProps) => [...]),
  context.helper(WITH_CTX) // WITH_CTX = Symbol(__DEV__ ? `withCtx` : ``)

  // 组件节点子元素列表
  const { children, loc } = node
  // 保存组件的slot节点列表
  const slotsProperties: Property[] = []
  // 保存动态的slot节点列表 (if/for)
  const dynamicSlots: (ConditionalExpression | CallExpression)[] = []

  // 创建一个的 default slot 节点
  // 即 当组件当子元素中不存在slot节点，则都分配到 'default'
  const buildDefaultSlotProperty = (
    props: ExpressionNode | undefined,
    children: TemplateChildNode[]
  ) => createObjectProperty(`default`, buildSlotFn(props, children, loc)) // JS_PROPERTY 创建一个js对象属性节点，如 { default: _withCtx((slotProps) => [...]) }

  // 组件/子元素存在动态v-slot、 子元素<template v-slot> 存在v-if/v-for指令
  // 或组件元素的祖先元素中存在v-slot/v-for
  // If the slot is inside a v-for or another v-slot, force it to be dynamic
  // since it likely uses a scope variable.
  let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0

  // TODO: analyze - !__BROWSER__
  // with `prefixIdentifiers: true`, this can be further optimized to make
  // it dynamic only when the slot actually uses the scope variables.
  if (!__BROWSER__ && !context.ssr && context.prefixIdentifiers) {
    hasDynamicSlots = hasScopeRef(node, context.identifiers)
  }

  // 1. Check for slot with slotProps on component itself.
  // 解析 组件的 v-slot 指令，得到指定name slot 的内容
  // 如：<slot-demo class="red" :data-text="true" v-slot:header="slotProps">abc - {{ slotProps.id }}</slot-demo>
  // 组件SlotDemo：template:
  //         '<div class="slot-demo">
  //           <div class="default-slot"><slot id="001"></slot></div>
  //           <div class="header-slot"><slot name="header" id="002"></slot></div>
  //         </div>'
  // 把子元素解析到组件的header slot，结果为：abc - 002
  const onComponentSlot = findDir(node, 'slot', true)
  if (onComponentSlot) {
    // 如 v-slot:header="slotProps"
    // arg 指令参数节点 - 设置 插槽名，如 'header'
    // exp 指令值节点 - 设置 插槽prop，如 'slotProps'
    const { arg, exp } = onComponentSlot
    if (arg && !isStaticExp(arg)) {
      // 动态指令参数，<Comp v-slot:[xxx]="{ prop }" />
      hasDynamicSlots = true
    }
    // slot节点列表
    slotsProperties.push(
      // 根据 v-slot 指定，创建组件的slot节点：
      createObjectProperty(
        arg || createSimpleExpression('default', true), // 指定 slot的name: 代表此组件的子元素内容属于哪个slot
        buildSlotFn(exp, children, loc) // 子元素的js ast节点
      )
    )
  }

  // 解析子元素 <template v-slot>

  // 2. Iterate through children and check for template slots
  let hasTemplateSlots = false // 组件存在子节点 <template v-slot...>
  let hasNamedDefaultSlot = false // 存在 'default'，即：<template v-slot> 或 <template v-slot:default>
  const implicitDefaultChildren: TemplateChildNode[] = [] // 保存非 <template v-slot> 节点，添加到 default slot
  const seenSlotNames = new Set<string>() // 保存<template v-slot...>节点的 slot name

  // 处理顺序：普通元素、动态slot、静态slot
  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i]
    let slotDir // 子元素标签为template的slot指令属性节点

    // 普通子节点，即非 <template v-slot>，保存到 default slot
    if (
      !isTemplateNode(slotElement) || // 是否是template标签节点: <template />
      !(slotDir = findDir(slotElement, 'slot', true)) // 是否存在slot指令属性
    ) {
      // not a <template v-slot>, skip.
      if (slotElement.type !== NodeTypes.COMMENT) {
        implicitDefaultChildren.push(slotElement)
      }
      continue
    }

    // 组件与子元素template 不可同时存在 v-slot 指令
    if (onComponentSlot) {
      // already has on-component slot - this is incorrect usage.
      context.onError(
        // 如: <Comp v-slot...><template v-slot...>...</template></Comp>
        // 这种情况下，所有slot都该选择子元素template形式
        createCompilerError(ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE, slotDir.loc)
      )
      break
    }

    // 开始处理 子元素 <template v-slot>
    hasTemplateSlots = true
    const { children: slotChildren, loc: slotLoc } = slotElement // 组件当前子元素
    const {
      // v-slot:header="slotProps"
      // 默认(即不存在指令参数时)为： 'default' slot
      arg: slotName = createSimpleExpression(`default`, true), // slot 节点名，SIMPLE_EXPRESSION
      exp: slotProps, // 指令属性值，即 slot props
      loc: dirLoc
    } = slotDir // 当前子元素slot的的指令属性节点

    // 保存静态v-slot的 name、子元素是否存在动态v-slot
    let staticSlotName: string | undefined
    if (isStaticExp(slotName)) {
      // 静态的slot，如：v-slot:header，则 slotName.content = 'header'，默认 'default'
      staticSlotName = slotName ? slotName.content : `default`
    } else {
      // 子元素存在动态v-slot，如: v-slot:[xxx]
      hasDynamicSlots = true
    }

    // slot 节点值 即组件子元素的js ast节点
    const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc) // JS_FUNCTION_EXPRESSION

    // check if this slot is conditional (v-if/v-for)
    // 注意 组件节点跳过 插件transform if/for，所以需要在此单独处理if/for
    let vIf: DirectiveNode | undefined // 子元素存在 v-if
    let vElse: DirectiveNode | undefined // 子元素存在 v-else-if/else
    let vFor: DirectiveNode | undefined // 子元素存在 v-for
    if ((vIf = findDir(slotElement, 'if'))) {
      hasDynamicSlots = true // 动态slot
      dynamicSlots.push(
        // 动态slot，创建一个条件js ast节点: JS_CONDITIONAL_EXPRESSION
        createConditionalExpression(
          vIf.exp!, // test - if 条件表达式
          // 创建动态子元素slot的 js ast节点: 节点key - slot name，节点value - 子元素内容
          buildDynamicSlot(slotName, slotFunction), // consequent - if true， 动态slot对象 js ast节点
          defaultFallback // alternate - if false，默认为undefined -  createSimpleExpression(`undefined`, false)
        )
      )
    } else if (
      (vElse = findDir(slotElement, /^else(-if)?$/, true /* allowEmpty */))
    ) {
      // 思路：寻找前一个带有v-if的template元素节点，然后递归该if节点找到alternate（即if false 所代表的位置），
      // 将v-else-if/v-else节点的slot节点绑定到if节点的alternate，并在组件的子元素列表中 移除 此子元素。

      // find adjacent v-if
      let j = i
      let prev
      while (j--) {
        prev = children[j] // 前一个非注释节点
        if (prev.type !== NodeTypes.COMMENT) {
          break
        }
      }

      // 前一个节点: 含有 v-if 的 template元素
      if (prev && isTemplateNode(prev) && findDir(prev, 'if')) {
        children.splice(i, 1) // 在组件的子元素列表中 移除 此子元素，之后会将该子元素绑定到if节点的alternate
        i-- // 调整下一轮要解析的组件子元素

        __TEST__ && assert(dynamicSlots.length > 0)

        // 递归if节点，设置上一个if/else-if条件为false时的节点内容
        // attach this slot to previous conditional
        let conditional = dynamicSlots[
          dynamicSlots.length - 1 // 前边子元素的v-if slot条件表达式节点
        ] as ConditionalExpression
        while (
          conditional.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
        ) {
          // 获取上一个子元素slot的条件表达式为false时的节点信息
          conditional = conditional.alternate
        }

        // 更新上一个if/else-if条件为false时的js ast节点内容
        conditional.alternate = vElse.exp // v-else-if 存在条件
          ? createConditionalExpression(
              vElse.exp, // v-else-if 条件表达式
              buildDynamicSlot(slotName, slotFunction), // 条件true 对应的位置 - 即此子元素所代表的slot节点
              defaultFallback // alternate - 条件false 对应的位置，创建 'undefined' slot节点
            )
          : buildDynamicSlot(slotName, slotFunction) // v-else子元素代表的slot节点
      } else {
        // 前边无相邻的v-if，即前边第一个非注释的节点不带有v-if指令
        context.onError(
          createCompilerError(ErrorCodes.X_V_ELSE_NO_ADJACENT_IF, vElse.loc) // v-else/v-else-if has no adjacent v-if
        )
      }
    } else if ((vFor = findDir(slotElement, 'for'))) {
      hasDynamicSlots = true

      // 解析 v-for 表达式值，创建对应的js ast 节点
      const parseResult =
        vFor.parseResult ||
        // 分析 in/of 左侧/右侧内容，并设置左侧的key、value、index节点信息，同时也进行了js语法校验
        parseForExpression(vFor.exp as SimpleExpressionNode, context)

      if (parseResult) {
        // 匹配规则 /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
        // Render the dynamic slots as an array and add it to the createSlot()
        // args. The runtime knows how to handle it appropriately.
        dynamicSlots.push(
          // 创建v-for 对应的slot节点列表，JS_CALL_EXPRESSION
          // 生成的渲染源码如：
          //      _renderList(items, (item, key, index) => {
          //         return {
          //           name: item.name,
          //           fn: _withCtx((slotProps) => [
          //             _createTextVNode("嘿嘿嘿 " + _toDisplayString(item.name), 1 /* TEXT */)     // 子节点
          //           ])
          //         }
          //       })
          // RENDER_LIST = Symbol(__DEV__ ? `renderList` : ``)
          createCallExpression(context.helper(RENDER_LIST), [
            // 创建子元素v-for的 js ast节点
            parseResult.source, // 遍历目标的 js ast节点
            createFunctionExpression(
              // 遍历回调函数的 js ast节点
              createForLoopParams(parseResult), // 遍历回调函数的参数item/key/index列表的js ast节点
              buildDynamicSlot(slotName, slotFunction), // v-for 的 slot 节点列表
              true /* force newline */ // v-for 渲染源码换行
            )
          ])
        )
      } else {
        // 无效的 v-for 表达式值
        context.onError(
          createCompilerError(ErrorCodes.X_V_FOR_MALFORMED_EXPRESSION, vFor.loc) // v-for has invalid expression
        )
      }
    } else {
      // 静态: <template v-slot:xxx>
      // 注意：slot name 不可以重复，还有默认slot name为 'default'

      // check duplicate static names
      if (staticSlotName) {
        if (seenSlotNames.has(staticSlotName)) {
          /// slot name 不可重复
          context.onError(
            createCompilerError(
              ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES, // Duplicate slot names found.
              dirLoc
            )
          )
          continue
        }
        seenSlotNames.add(staticSlotName) // 保存slot name
        if (staticSlotName === 'default') {
          hasNamedDefaultSlot = true // 存在 'default'，即：<template v-slot> 或 <template v-slot:default>
        }
      }
      // 添加 slot 节点：节点名 - slotName、节点内容（即组件子节点） - slotFunction
      slotsProperties.push(createObjectProperty(slotName, slotFunction))
    }
  }

  // 普通子节点 分配到 'default' slot

  if (!onComponentSlot) {
    // 组件自身不带 v-slot 指令

    if (!hasTemplateSlots) {
      // 组件没有子节点<template v-slot>即 只有普通子元素，都分配到 'default' slot

      // implicit default slot (on component)
      slotsProperties.push(buildDefaultSlotProperty(undefined, children))
    } else if (implicitDefaultChildren.length) {
      // 存在普通节点时，slots节点列表中不可以有 'default' slot

      // implicit default slot (mixed with named slots)
      if (hasNamedDefaultSlot) {
        context.onError(
          createCompilerError(
            ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN,
            implicitDefaultChildren[0].loc
          )
        )
      } else {
        // 将普通子节点，分配到 'default' slot
        slotsProperties.push(
          buildDefaultSlotProperty(undefined, implicitDefaultChildren)
        )
      }
    }
  }

  // 创建slot节点列表，静态 + 动态

  // 设置 组件节点的 SlotFlags
  const slotFlag = hasDynamicSlots // 是否存在动态 slot，如 动态v-slot:[xxx]、或 v-if/v-for、或 嵌套v-if/v-for
    ? SlotFlags.DYNAMIC // 2
    : hasForwardedSlots(node.children) // 组件子孙节点中 是否存在 slot 标签元素
      ? SlotFlags.FORWARDED // 3
      : SlotFlags.STABLE // 1

  // 创建 静态slots节点列表 的js对象格式：将数组转换为对象
  let slots = createObjectExpression(
    slotsProperties.concat(
      createObjectProperty(
        `_`,
        // 2 = compiled but dynamic = can skip normalization, but must run diff
        // 1 = compiled and static = can skip normalization AND diff as optimized
        createSimpleExpression(
          slotFlag + (__DEV__ ? ` /* ${slotFlagsText[slotFlag]} */` : ``),
          false
        )
      )
    ),
    loc
  ) as SlotsExpression

  // 创建 动态slot节点列表
  if (dynamicSlots.length) {
    // 组件子节点<template v-slot> 中存在 v-if/v-for指令

    // CREATE_SLOTS = Symbol(__DEV__ ? `createSlots` : ``)
    // 创建一个 执行函数的表达式 的js ast节点， _createSlots(静态slots，动态slots)
    slots = createCallExpression(context.helper(CREATE_SLOTS), [
      slots, // 静态slot 对象格式
      createArrayExpression(dynamicSlots) // 创建一个数组表达式 的js ast节点，保存动态slot列表
    ]) as SlotsExpression
  }

  return {
    slots, // 组件的slots节点列表：静态节点列表、动态节点列表
    hasDynamicSlots // 存在动态的slot: 是否存在动态 slot，如 动态v-slot:[xxx]、或 v-if/v-for、或 嵌套v-if/v-for
  }
}

// 创建组件子元素对应的动态slot节点:
//    节点 key - slot name，
//    节点 value - slot 内容，即子元素的js ast节点
function buildDynamicSlot(
  name: ExpressionNode,
  fn: FunctionExpression
): ObjectExpression {
  return createObjectExpression([
    // js 对象 节点
    createObjectProperty(`name`, name), // js 对象属性 节点，参数1、参数2都是 createSimpleExpression
    createObjectProperty(`fn`, fn) // js 对象属性 节点， fn 为 动态子元素slot内容 js ast节点
  ])
}

// 组件子孙节点中 是否存在 slot标签元素
function hasForwardedSlots(children: TemplateChildNode[]): boolean {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === NodeTypes.ELEMENT) {
      if (
        child.tagType === ElementTypes.SLOT || // slot标签元素
        (child.tagType === ElementTypes.ELEMENT && // 继续递归
          hasForwardedSlots(child.children))
      ) {
        return true
      }
    }
  }
  return false
}
