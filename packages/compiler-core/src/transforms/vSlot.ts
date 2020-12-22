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

const buildClientSlotFn: SlotFnBuilder = (props, children, loc) =>
  createFunctionExpression(
    props, // 参数
    children, // 返回值
    false /* newline */,
    true /* isSlot */, // 创建slot 函数
    children.length ? children[0].loc : loc
  )

// 解析节点上的 slot属性，并分析子元素中带有v-slot的template节点
// Instead of being a DirectiveTransform, v-slot processing is called during
// transformElement to build the slots object for a component.
export function buildSlots(
  node: ElementNode,
  context: TransformContext,
  buildSlotFn: SlotFnBuilder = buildClientSlotFn // 创建构建slot的函数节点
): {
  slots: SlotsExpression // slot模版节点信息，如：当前节点的v-slot; 当前节点下如果都没有slot模版，保存所有子元素为默认slot; 不存在默认slot模版时，保存非slot模版子元素为默认slot; 保存slotFlag相关信息； 动态的v-if/v-for的 dynamicSlots
  hasDynamicSlots: boolean // 动态的slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
} {
  context.helper(WITH_CTX) // WITH_CTX = Symbol(__DEV__ ? `withCtx` : ``)

  // 节点子元素列表
  const { children, loc } = node
  const slotsProperties: Property[] = [] //
  const dynamicSlots: (ConditionalExpression | CallExpression)[] = [] // 保存子元素中的动态slot v-if/v-for slot节点

  const buildDefaultSlotProperty = (
    props: ExpressionNode | undefined,
    children: TemplateChildNode[]
  ) => createObjectProperty(`default`, buildSlotFn(props, children, loc))

  // 是否存在嵌套的slot，根据 trackSlotScopes 插件
  // If the slot is inside a v-for or another v-slot, force it to be dynamic
  // since it likely uses a scope variable.
  let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0

  // TODO: analyze - !__BROWSER__
  // with `prefixIdentifiers: true`, this can be further optimized to make
  // it dynamic only when the slot actually uses the scope variables.
  if (!__BROWSER__ && !context.ssr && context.prefixIdentifiers) {
    hasDynamicSlots = hasScopeRef(node, context.identifiers)
  }

  // 解析 此元素 slot指令

  // 1. Check for slot with slotProps on component itself.
  //    <Comp v-slot="{ prop }"/> 或 <span v-slot:header="propObj" />，注意：v-slot:header 缩写 #header，ast解析时，把 # 解析为 slot
  const onComponentSlot = findDir(node, 'slot', true)
  if (onComponentSlot) {
    const { arg, exp } = onComponentSlot // arg指令参数：插槽名；exp 插槽prop
    if (arg && !isStaticExp(arg)) {
      // 动态slot，<Comp v-slot:[xxx]="{ prop }" />
      hasDynamicSlots = true
    }
    slotsProperties.push(
      // 创建此元素的 slot prop属性节点
      createObjectProperty(
        arg || createSimpleExpression('default', true), // key: 插件默认插槽
        buildSlotFn(exp, children, loc) // value: 创建一个slot执行函数节点
      )
    )
  }

  // 解析 子元素 slot指令

  // 2. Iterate through children and check for template slots
  //    <template v-slot:foo="{ prop }">
  let hasTemplateSlots = false // 是否存在 <Comp><template v-slot></template></Comp>
  let hasNamedDefaultSlot = false // 是否 存在名为 'default' 的slot，默认为default
  const implicitDefaultChildren: TemplateChildNode[] = [] // 非注释子元素节点，同时也不是 <template v-slot></template>，为了添加到默认slot
  const seenSlotNames = new Set<string>() // 保存slot的名字，如 v-slot:default、v-slot:header

  // 注意 会移除带有v-if指令的children：<template v-slot v-if=""></template>
  for (let i = 0; i < children.length; i++) {
    const slotElement = children[i]
    let slotDir // 子元素标签为template的slot指令属性节点

    // 跳过 非 <template v-slot>，添加到默认slot
    if (
      !isTemplateNode(slotElement) || // 是否是template标签节点: <template />
      !(slotDir = findDir(slotElement, 'slot', true)) // 是否存在slot指令属性
    ) {
      // not a <template v-slot>, skip.
      if (slotElement.type !== NodeTypes.COMMENT) {
        // 非注释节点，添加到默认插槽
        implicitDefaultChildren.push(slotElement)
      }
      continue
    }

    // 解析 子元素template： <Comp><template v-slot></template></Comp>

    if (onComponentSlot) {
      // 当前节点（即父节点）不能重复设置 slot，如: <Comp v-slot><template v-slot></template></Comp>
      // already has on-component slot - this is incorrect usage.
      context.onError(
        // Mixed v-slot usage on both the component and nested
        // When there are multiple named slots, all slots should use <template> syntax to avoid scope ambiguity.
        createCompilerError(ErrorCodes.X_V_SLOT_MIXED_SLOT_USAGE, slotDir.loc)
      )
      // 结束遍历子元素
      break
    }

    hasTemplateSlots = true // 如 <Comp><template v-slot></template></Comp>
    const { children: slotChildren, loc: slotLoc } = slotElement
    const {
      arg: slotName = createSimpleExpression(`default`, true), // 指令参数节点，默认slot的参数为 'default'
      exp: slotProps, // slot的props
      loc: dirLoc
    } = slotDir // 子元素template的slot指令属性节点

    // check if name is dynamic.
    let staticSlotName: string | undefined
    if (isStaticExp(slotName)) {
      // 静态的slot，如：v-slot:header，则 slotName.content = 'header'，默认 'default'
      staticSlotName = slotName ? slotName.content : `default`
    } else {
      // 动态，如: v-slot:[xxx]
      hasDynamicSlots = true
    }

    // 解析 子元素template的v-if、v-else/v-else-if、v-for指令，优先处理这些指令; 如果都没有，在正常处理静态的slot: 'v-slot:header' 之类

    const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc) // 创建slot运行函数，type: NodeTypes.JS_FUNCTION_EXPRESSION

    // check if this slot is conditional (v-if/v-for)
    let vIf: DirectiveNode | undefined
    let vElse: DirectiveNode | undefined
    let vFor: DirectiveNode | undefined
    if ((vIf = findDir(slotElement, 'if'))) {
      // v-if 指令

      hasDynamicSlots = true // 动态slot
      dynamicSlots.push(
        // 保存子元素的
        createConditionalExpression(
          // 创建条件表达式节点 type: NodeTypes.JS_CONDITIONAL_EXPRESSION
          vIf.exp!, // test， if指令值节点
          buildDynamicSlot(slotName, slotFunction), // consequent， 创建 type: NodeTypes.JS_OBJECT_EXPRESSION
          defaultFallback // alternate，vElse条件值，  createSimpleExpression(`undefined`, false)
        )
      )
    } else if (
      (vElse = findDir(slotElement, /^else(-if)?$/, true /* allowEmpty */))
    ) {
      // v-else 或 v-else-if 指令

      // 查找前边相邻带有v-if的子元素
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

        // 关联前边v-if信息
        // attach this slot to previous conditional
        let conditional = dynamicSlots[
          dynamicSlots.length - 1 // 前边子元素的v-if slot条件表达式节点
        ] as ConditionalExpression
        while (
          conditional.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
        ) {
          // 查找前边相邻带有v-if指令的子元素
          conditional = conditional.alternate
        }
        conditional.alternate = vElse.exp
          ? createConditionalExpression(
              // 有条件值
              vElse.exp,
              buildDynamicSlot(slotName, slotFunction), // createObjectExpression([ createObjectProperty(`name`, name), createObjectProperty(`fn`, fn)])
              defaultFallback // createSimpleExpression(`undefined`, false)
            )
          : buildDynamicSlot(slotName, slotFunction) // createObjectExpression([ createObjectProperty(`name`, name), createObjectProperty(`fn`, fn)])
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
    hasDynamicSlots // 存在动态的slot: 是否存在嵌套的slot，根据 trackSlotScopes 插件; 或 slot指令是动态，v-slot:[xxx]；或template标签模版上带有v-slot 且 还带有 v-if或 v-for
  }
}

// 创建动态slot对象节点
function buildDynamicSlot(
  name: ExpressionNode,
  fn: FunctionExpression
): ObjectExpression {
  return createObjectExpression([
    createObjectProperty(`name`, name),
    createObjectProperty(`fn`, fn)
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
