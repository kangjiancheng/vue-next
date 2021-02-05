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

// 创建组件某个slot的内容 对应的js ast节点
const buildClientSlotFn: SlotFnBuilder = (props, children, loc) =>
  createFunctionExpression(
    // JS_FUNCTION_EXPRESSION
    props, // 参数
    children, // 返回值
    false /* newline */,
    true /* isSlot */, // 创建slot 函数
    children.length ? children[0].loc : loc
  )

// 解析组件子元素，作为组件内部的slot元素（不包括 TELEPORT、KEEP_ALIVE）
// 如 template: '<slot-demo class="red" :data-text="true" v-slot="slotProps">abc - {{ slotProps.id }}</slot-demo>'

// Instead of being a DirectiveTransform, v-slot processing is called during
// transformElement to build the slots object for a component.
export function buildSlots(
  node: ElementNode,
  context: TransformContext,
  buildSlotFn: SlotFnBuilder = buildClientSlotFn // 创建组件某个slot的内容对应的js ast节点
): {
  slots: SlotsExpression // slot模版节点信息替换子节点列表，如：当前节点的v-slot; 当前节点下如果都没有slot模版，保存所有子元素为默认slot; 不存在默认slot模版时，保存非slot模版子元素为默认slot; 保存slotFlag相关信息； 动态的v-if/v-for的 dynamicSlots
  hasDynamicSlots: boolean // 动态的slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
} {
  // 收集添加组件vnode渲染源码的上下文，如渲染源码： default: _withCtx((slotProps) => [...]),
  context.helper(WITH_CTX) // WITH_CTX = Symbol(__DEV__ ? `withCtx` : ``)

  // 节点子元素列表
  const { children, loc } = node
  // 组件的slots列表，即将子元素转换到对应的slot，如 [ {default: {...}, { header: {...} }
  const slotsProperties: Property[] = []
  // 动态的slots列表: 子元素<template v-slot> 存在v-if/v-for指令
  const dynamicSlots: (ConditionalExpression | CallExpression)[] = []

  // 将子元素默认解析为 default slot
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
    slotsProperties.push(
      // 根据 v-slot 指定，创建组件的 slot 子元素：
      createObjectProperty(
        arg || createSimpleExpression('default', true), // 指定 slot的name: 代表此组件的子元素内容属于哪个slot
        buildSlotFn(exp, children, loc) // 创建该slot代表的子元素内容的js ast节点
      )
    )
  }

  // 解析子元素 <template v-slot>

  // 2. Iterate through children and check for template slots
  let hasTemplateSlots = false // 存在子元素 <template v-slot>
  let hasNamedDefaultSlot = false // 存在子元素 default slot
  const implicitDefaultChildren: TemplateChildNode[] = [] // 保存非<template v-slot>子元素，添加到 default slot
  const seenSlotNames = new Set<string>() // 保存slot的名字，如 v-slot:default、v-slot:header

  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i]
    let slotDir // 子元素标签为template的slot指令属性节点

    // 子元素非 <template v-slot>，保存到 default slot
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
      arg: slotName = createSimpleExpression(`default`, true), // 指令参数，即slot name，SIMPLE_EXPRESSION
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

    // 子元素对应的js ast节点，节点类型为 JS_FUNCTION_EXPRESSION，
    const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc)

    // check if this slot is conditional (v-if/v-for)
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
      // 匹配前边相邻带有v-if的子元素
      // find adjacent v-if
      let j = i
      let prev
      while (j--) {
        prev = children[j]
        if (prev.type !== NodeTypes.COMMENT) {
          // 匹配前一个非注释子元素节点
          break
        }
      }
      if (prev && isTemplateNode(prev) && findDir(prev, 'if')) {
        // 如果前边第一个非注释的节点是 template标签节点且带有v-if指令，即如： <template v-if=""></template>
        // 移除子元素列表中的该子元素，注意 slotElement 还是代表当前子元素slot
        children.splice(i, 1)
        i-- // 重新定位前一个子元素

        __TEST__ && assert(dynamicSlots.length > 0)

        // 设置上一个if/else-if条件为false时的节点内容
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
              buildDynamicSlot(slotName, slotFunction), // v-else-if 为 true 时的 slot 内容
              defaultFallback // v-else-if 为false时，slot内容默认为 'undefined'
            )
          : buildDynamicSlot(slotName, slotFunction) // 条件 v-else 对应的 slot 内容
      } else {
        // 前边无相邻的v-if，即前边第一个非注释的节点不带有v-if指令
        context.onError(
          createCompilerError(ErrorCodes.X_V_ELSE_NO_ADJACENT_IF, vElse.loc) // v-else/v-else-if has no adjacent v-if
        )
      }
    } else if ((vFor = findDir(slotElement, 'for'))) {
      // v-for指令
      /**
       * 例子如：
       *   <component-demo>
       *     <template v-for="(slotItem, slotIndex) in ['default', 'header']" v-slot:[slotItem]>{{ slotItem }}</template>
       *   </component-demo>
       *
       * 其中：component-demo
       *   <div class="component-demo">
       *     <slot></slot>
       *     <slot name="header"></slot>
       *   </div>
       */

      hasDynamicSlots = true

      // 解析 v-for 表达式值，分析 in/of 左侧/右侧内容，并设置左侧的key、value、index节点信息，同时也进行了js语法校验
      const parseResult =
        vFor.parseResult ||
        parseForExpression(vFor.exp as SimpleExpressionNode, context)

      if (parseResult) {
        // 匹配规则 /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
        // Render the dynamic slots as an array and add it to the createSlot()
        // args. The runtime knows how to handle it appropriately.
        dynamicSlots.push(
          // 创建运行函数配置，slot 作为一个数组
          createCallExpression(context.helper(RENDER_LIST), [
            //  RENDER_LIST = Symbol(__DEV__ ? `renderList` : ``)
            parseResult.source, // v-for="... in/of ..." 其中右侧相关内容节点信息
            createFunctionExpression(
              // 创建slot函数表达式节点
              createForLoopParams(parseResult),
              buildDynamicSlot(slotName, slotFunction), // createObjectExpression([ createObjectProperty(`name`, name), createObjectProperty(`fn`, fn)])
              true /* force newline */
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
      // 处理静态的 slot
      // 无 v-if/else、v-for时， 正常解析 v-slot:args 参数内容，是否有重复的slot

      // check duplicate static names
      if (staticSlotName) {
        if (seenSlotNames.has(staticSlotName)) {
          context.onError(
            createCompilerError(
              ErrorCodes.X_V_SLOT_DUPLICATE_SLOT_NAMES, // Duplicate slot names found.
              dirLoc
            )
          )
          continue
        }
        seenSlotNames.add(staticSlotName)
        if (staticSlotName === 'default') {
          // 存在default slot，默认为default
          hasNamedDefaultSlot = true
        }
      }
      // slot 属性节点
      slotsProperties.push(createObjectProperty(slotName, slotFunction))
    }
  }

  // 遍历处理 子元素 结束

  if (!onComponentSlot) {
    // 如果不存在 v-slot 指令

    if (!hasTemplateSlots) {
      // 不是一个 <template v-slot></template>
      // 如: <Comp>...</Comp> 或 <Comp><template></template></Comp>
      // 则暗示为一个default slot
      // implicit default slot (on component)
      slotsProperties.push(buildDefaultSlotProperty(undefined, children)) // 当子元素中不存在slot模版时，为所有子元素创建一个默认的slop属性节点
    } else if (implicitDefaultChildren.length) {
      // implicit default slot (mixed with named slots)
      if (hasNamedDefaultSlot) {
        // 在 default slot 之外，如果还存在一些子元素，则这些会被忽略
        // 如：<Comp> <div>...</div> <template v-slot>...</template> </Comp>
        context.onError(
          createCompilerError(
            ErrorCodes.X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN,
            implicitDefaultChildren[0].loc
          )
        )
      } else {
        slotsProperties.push(
          buildDefaultSlotProperty(undefined, implicitDefaultChildren) // 当子元素中不存在 默认slot 模版时，为非slot中的子元素创建一个默认的slop属性节点
        )
      }
    }
  }

  // 设置 节点元素的 SlotFlags
  const slotFlag = hasDynamicSlots
    ? SlotFlags.DYNAMIC // 动态slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
    : hasForwardedSlots(node.children)
      ? SlotFlags.FORWARDED // 子孙元素中 存在 ELEMENT 元素标签为 slot
      : SlotFlags.STABLE // 子孙元素中 不存在 ELEMENT 元素标签为 slot

  // 保存slotsProperties节点信息
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

  if (dynamicSlots.length) {
    // 子元素中的动态slot v-if/v-for slot节点 ； CREATE_SLOTS = Symbol(__DEV__ ? `createSlots` : ``)
    slots = createCallExpression(context.helper(CREATE_SLOTS), [
      slots,
      createArrayExpression(dynamicSlots)
    ]) as SlotsExpression
  }

  return {
    slots, // 保存默认slot信息，如：当前节点的v-slot; 当前节点下如果都没有slot模版，保存所有子元素为默认slot; 不存在默认slot模版时，保存非slot模版子元素为默认slot; 保存slotFlag相关信息； 动态的v-if/v-for的 dynamicSlots
    hasDynamicSlots // 存在动态的slot:
  }
}

// 创建动态子元素slot的 js ast节点: 节点key - slot name，节点value - 子元素内容
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

// 子元素及其子孙列表中是否存在标签名为slot
function hasForwardedSlots(children: TemplateChildNode[]): boolean {
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === NodeTypes.ELEMENT) {
      if (
        child.tagType === ElementTypes.SLOT || // 子元素列表中是否存在标签名为slot
        (child.tagType === ElementTypes.ELEMENT && // 子元素下的子孙元素是否存在标签名为slot
          hasForwardedSlots(child.children))
      ) {
        return true
      }
    }
  }
  return false
}
