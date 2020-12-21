import { NodeTransform, TransformContext } from '../transform'
import {
  NodeTypes,
  ElementTypes,
  CallExpression,
  ObjectExpression,
  ElementNode,
  DirectiveNode,
  ExpressionNode,
  ArrayExpression,
  createCallExpression,
  createArrayExpression,
  createObjectProperty,
  createSimpleExpression,
  createObjectExpression,
  Property,
  ComponentNode,
  VNodeCall,
  TemplateTextChildNode,
  DirectiveArguments,
  createVNodeCall,
  ConstantTypes
} from '../ast'
import {
  PatchFlags,
  PatchFlagNames,
  isSymbol,
  isOn,
  isObject,
  isReservedProp,
  capitalize,
  camelize
} from '@vue/shared'
import { createCompilerError, ErrorCodes } from '../errors'
import {
  RESOLVE_DIRECTIVE,
  RESOLVE_COMPONENT,
  RESOLVE_DYNAMIC_COMPONENT,
  MERGE_PROPS,
  TO_HANDLERS,
  TELEPORT,
  KEEP_ALIVE,
  SUSPENSE,
  UNREF
} from '../runtimeHelpers'
import {
  getInnerRange,
  toValidAssetId,
  findProp,
  isCoreComponent,
  isBindKey,
  findDir,
  isStaticExp
} from '../utils'
import { buildSlots } from './vSlot'
import { getConstantType } from './hoistStatic'
import { BindingTypes } from '../options'

// some directive transforms (e.g. v-model) may return a symbol for runtime
// import, which should be used instead of a resolveDirective call.
// 运行时的指令导入，如 v-model、v-show
const directiveImportMap = new WeakMap<DirectiveNode, symbol>()

// generate a JavaScript AST for this element's codegen
// 为当前节点的ast生成对应的codegen 编译结果
export const transformElement: NodeTransform = (node, context) => {
  if (
    !(
      node.type === NodeTypes.ELEMENT &&
      (node.tagType === ElementTypes.ELEMENT || // 转换处理 html元素节点、 组件节点
        node.tagType === ElementTypes.COMPONENT)
    )
  ) {
    return
  }

  // perform the work on exit, after all child expressions have been
  // processed and merged.
  // 由于当前节点的transform插件列表是先添加后执行，所以会在当前节点的子节点经过 transformText即文本内容合并后，再执行这个插件
  return function postTransformElement() {
    const { tag, props } = node // node.type ELEMENT 类型节点: dom元素、 组件节点
    const isComponent = node.tagType === ElementTypes.COMPONENT //  当前节点为组件类型

    // The goal of the transform is to create a codegenNode implementing the
    // VNodeCall interface.
    // 该transform插件主要是为了创建 codegenNode 信息，为了在vnode时调用

    // 解析is指令

    // 解析组件类型，返回相关内容，如动态is组件的 vnode patch方法、内置组件名、区分用户自定义组件名
    const vnodeTag = isComponent
      ? resolveComponentType(node as ComponentNode, context) // 解析is指令
      : `"${tag}"` // dom 元素标签名
    // 是否是动态组件
    const isDynamicComponent =
      isObject(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT

    let vnodeProps: VNodeCall['props']
    let vnodeChildren: VNodeCall['children']
    let vnodePatchFlag: VNodeCall['patchFlag']
    let patchFlag: number = 0
    let vnodeDynamicProps: VNodeCall['dynamicProps']
    let dynamicPropNames: string[] | undefined
    let vnodeDirectives: VNodeCall['directives']

    let shouldUseBlock =
      // dynamic component may resolve to plain elements
      isDynamicComponent || // 动态is组件
      vnodeTag === TELEPORT || // Teleport
      vnodeTag === SUSPENSE || // Suspense
      (!isComponent &&
        // <svg> and <foreignObject> must be forced into blocks so that block
        // updates inside get proper isSVG flag at runtime. (#639, #643)
        // This is technically web-specific, but splitting the logic out of core
        // leads to too much unnecessary complexity.
        (tag === 'svg' || // web规范的一些特殊标签
          tag === 'foreignObject' ||
          // #938: elements with dynamic keys should be forced into blocks
          findProp(node, 'key', true))) //  绑定了key指令， ':key'，非静态属性

    // props 节点属性列表

    if (props.length > 0) {
      // 解析属性列表：静态属性、指令属性
      // 指令属性：v-bind、v-on、v-model、v-html、v-text、v-show、v-cloak、用户自定义指令; 跳过解析：slot、once、is、ssr下的on
      // 属性去重合并，转换key/value
      // 设置node的 patchFlag
      const propsBuildResult = buildProps(node, context)

      vnodeProps = propsBuildResult.props // 解析后的props列表
      patchFlag = propsBuildResult.patchFlag // 根据相关prop信息，进行二进制运算设置patchFlag
      dynamicPropNames = propsBuildResult.dynamicPropNames // 静态prop key的name列表
      const directives = propsBuildResult.directives // 需要在运行时，重新处理的：v-model、v-show、用户自定义指令
      vnodeDirectives =
        directives && directives.length
          ? (createArrayExpression(
              directives.map(dir => buildDirectiveArgs(dir, context)) // 进一步解析 buildProps() 中的 runtimeDirectives：v-show、v-model、用户自定义指令；处理要运行的指令的参数、值、修饰符
            ) as DirectiveArguments)
          : undefined
    }

    // children
    if (node.children.length > 0) {
      if (vnodeTag === KEEP_ALIVE) {
        // Symbol(__DEV__ ? `KeepAlive` : ``)
        // 节点tag标签为 'keep-alive' 或 'KeepAlive'

        // Although a built-in component, we compile KeepAlive with raw children
        // instead of slot functions so that it can be used inside Transition
        // or other Transition-wrapping HOCs. // 高阶组件
        // To ensure correct updates with block optimizations, we need to:
        // 1. Force keep-alive into a block. This avoids its children being
        //    collected by a parent block.
        shouldUseBlock = true // 转换为block包裹，避免受到父节点影响

        // 2. Force keep-alive to always be updated, since it uses raw children.
        patchFlag |= PatchFlags.DYNAMIC_SLOTS // 加上动态slot
        if (__DEV__ && node.children.length > 1) {
          // 一个子元素/组件
          context.onError(
            createCompilerError(ErrorCodes.X_KEEP_ALIVE_INVALID_CHILDREN, {
              // <KeepAlive> expects exactly one child component.
              start: node.children[0].loc.start,
              end: node.children[node.children.length - 1].loc.end,
              source: ''
            })
          )
        }
      }

      // 处理slot

      // 组件，非 teleport、keep-alive组件（不是真实的组件）
      const shouldBuildAsSlots =
        isComponent && // 组件类型的节点
        // Teleport is not a real component and has dedicated runtime handling
        // Teleport、keep-alive 均不是一个真实的组件，且已经有专门的运行时处理逻辑
        vnodeTag !== TELEPORT &&
        // explained above.
        vnodeTag !== KEEP_ALIVE

      if (shouldBuildAsSlots) {
        const { slots, hasDynamicSlots } = buildSlots(node, context)
        vnodeChildren = slots
        if (hasDynamicSlots) {
          patchFlag |= PatchFlags.DYNAMIC_SLOTS
        }
      } else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        const child = node.children[0]
        const type = child.type
        // check for dynamic text children
        const hasDynamicTextChild =
          type === NodeTypes.INTERPOLATION ||
          type === NodeTypes.COMPOUND_EXPRESSION
        if (
          hasDynamicTextChild &&
          getConstantType(child, context) === ConstantTypes.NOT_CONSTANT
        ) {
          patchFlag |= PatchFlags.TEXT
        }
        // pass directly if the only child is a text node
        // (plain / interpolation / expression)
        if (hasDynamicTextChild || type === NodeTypes.TEXT) {
          vnodeChildren = child as TemplateTextChildNode
        } else {
          vnodeChildren = node.children
        }
      } else {
        vnodeChildren = node.children
      }
    }

    // patchFlag & dynamicPropNames
    if (patchFlag !== 0) {
      if (__DEV__) {
        if (patchFlag < 0) {
          // special flags (negative and mutually exclusive)
          vnodePatchFlag = patchFlag + ` /* ${PatchFlagNames[patchFlag]} */`
        } else {
          // bitwise flags
          const flagNames = Object.keys(PatchFlagNames)
            .map(Number)
            .filter(n => n > 0 && patchFlag & n)
            .map(n => PatchFlagNames[n])
            .join(`, `)
          vnodePatchFlag = patchFlag + ` /* ${flagNames} */`
        }
      } else {
        vnodePatchFlag = String(patchFlag)
      }
      if (dynamicPropNames && dynamicPropNames.length) {
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames)
      }
    }

    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      vnodePatchFlag,
      vnodeDynamicProps,
      vnodeDirectives,
      !!shouldUseBlock,
      false /* disableTracking */,
      node.loc
    )
  }
}

// 解析组件类型、解析v-is指令：返回相关内容，如动态is组件的 vnode patch方法、内置组件名、区分用户自定义组件名
export function resolveComponentType(
  node: ComponentNode, // 当前节点 即组件节点
  context: TransformContext, // transform 上下文
  ssr = false
) {
  const { tag } = node // 组件标签名

  // 1. dynamic component
  // 动态组件，存在is属性节点
  const isProp =
    node.tag === 'component' ? findProp(node, 'is') : findDir(node, 'is') // findProp 查找属性静态 is、bind静态属性 :is 。 findDir查找指令 v-is 。
  if (isProp) {
    // 注意： 如 template = '<HelloWorld is="Welcome" />' 则不符合此条件
    const exp =
      isProp.type === NodeTypes.ATTRIBUTE // dom静态is属性，如 '<component is="HelloWorld" />'
        ? isProp.value && createSimpleExpression(isProp.value.content, true) // 返回属性值相应的表达式对象
        : isProp.exp // 指令形式is属性，如 '<component :is="HelloWorld"/>' 或 v-is
    if (exp) {
      // 创建 is属性值表达式对应的组件patch方法：Symbol(`resolveDynamicComponent`)
      return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
        exp
      ])
    }
  }

  // 2. built-in components (Teleport, Transition, KeepAlive, Suspense...)
  // 如果是内置组件，直接返回，如核心组件tag：keep-alive 或 KeepAlive；或内置组件 transition
  const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag)
  if (builtIn) {
    // built-ins are simply fallthroughs / have special handling during ssr
    // so we don't need to import their runtime equivalents
    if (!ssr) context.helper(builtIn)
    return builtIn // 内置属性返回相应的KEEP_ALIVE= Symbol(__DEV__ ? `KeepAlive` : ``)
  }

  // TODO: analyze cfs
  // 3. user component (from setup bindings)
  // this is skipped in browser build since browser builds do not perform
  // binding analysis.
  if (!__BROWSER__) {
    const fromSetup = resolveSetupReference(tag, context)
    if (fromSetup) {
      return fromSetup
    }
  }
  // TODO: analyze cfs
  // 4. Self referencing component (inferred from filename)
  if (!__BROWSER__ && context.selfName) {
    if (capitalize(camelize(tag)) === context.selfName) {
      context.helper(RESOLVE_COMPONENT)
      context.components.add(`_self`)
      return toValidAssetId(`_self`, `component`)
    }
  }

  // 5. user component (resolve)
  //将用户自定义组件加入上下文
  context.helper(RESOLVE_COMPONENT)
  context.components.add(tag)
  return toValidAssetId(tag, `component`) // 设置组件id信息 如 tag = 'hello  world' 转换为 '_component_hello__world'
}

// TODO: analyze cfs
function resolveSetupReference(name: string, context: TransformContext) {
  const bindings = context.bindingMetadata
  if (!bindings) {
    return
  }

  const camelName = camelize(name)
  const PascalName = capitalize(camelName)
  const checkType = (type: BindingTypes) => {
    if (bindings[name] === type) {
      return name
    }
    if (bindings[camelName] === type) {
      return camelName
    }
    if (bindings[PascalName] === type) {
      return PascalName
    }
  }

  const fromConst = checkType(BindingTypes.SETUP_CONST)
  if (fromConst) {
    return context.inline
      ? // in inline mode, const setup bindings (e.g. imports) can be used as-is
        fromConst
      : `$setup[${JSON.stringify(fromConst)}]`
  }

  const fromMaybeRef =
    checkType(BindingTypes.SETUP_LET) ||
    checkType(BindingTypes.SETUP_REF) ||
    checkType(BindingTypes.SETUP_MAYBE_REF)
  if (fromMaybeRef) {
    return context.inline
      ? // setup scope bindings that may be refs need to be unrefed
        `${context.helperString(UNREF)}(${fromMaybeRef})`
      : `$setup[${JSON.stringify(fromMaybeRef)}]`
  }
}

export type PropsExpression = ObjectExpression | CallExpression | ExpressionNode

/**
 * 解析ast节点的属性列表props
 * 解析指令：v-bind、v-on、v-model、v-html、v-text、v-show、v-cloak、用户自定义指令; 跳过解析：slot、once、is、ssr下的on
 * 处理静态属性、静态/动态指令属性、合并去重属性
 * prop节点经createObjectProperty(key, value) 转换、并设置元素node节点的patchFlag
 */
export function buildProps(
  node: ElementNode, // dom元素节点 或组件节点
  context: TransformContext,
  props: ElementNode['props'] = node.props, // 属性列表
  ssr = false
): {
  props: PropsExpression | undefined
  directives: DirectiveNode[]
  patchFlag: number
  dynamicPropNames: string[]
} {
  const { tag, loc: elementLoc } = node
  const isComponent = node.tagType === ElementTypes.COMPONENT // 是否是组件
  let properties: ObjectExpression['properties'] = [] // createObjectProperty(key, value) 存储props中经过转换的属性值节点/属性名节点
  const mergeArgs: PropsExpression[] = [] // 配合v-on/v-bind（无参数指令） 合并去重属性
  const runtimeDirectives: DirectiveNode[] = [] // 如运行时指令，如 v-model，v-show

  // 依据相关信息，生成对应的patchFlag
  let patchFlag = 0
  let hasRef = false // 节点是否存在ref属性
  let hasClassBinding = false // 是否 v-bind:class
  let hasStyleBinding = false // 是否 v-bind:style
  let hasHydrationEventBinding = false // dom添加其它事件绑定
  let hasDynamicKeys = false // 是否存在动态指令
  let hasVnodeHook = false // 存在vnodehook，如onVnodeMounted
  const dynamicPropNames: string[] = [] // 动态prop名列表：是静态指令节点，且非 ref、style、class，且该指令没有被设置缓存，指令范围：v-on、v-bind、v-model、v-html、v-text

  // 根据属性列表设置相应的 PatchFlag 值
  // directiveTransforms后，进一步分析指令props属性节点：v-on、v-bind、v-model、v-html、v-text
  // prop属性节点 createObjectProperty(key, value)
  const analyzePatchFlag = ({ key, value }: Property) => {
    if (isStaticExp(key)) {
      // 静态js节点
      const name = key.content // （属性名/属性值/修饰符）节点名内容
      const isEventHandler = isOn(name) // /^on[^a-z]/  on 事件
      if (
        !isComponent && // 非组件节点，即dom节点
        isEventHandler &&
        // omit the flag for click handlers because hydration gives click
        // dedicated fast path.
        name.toLowerCase() !== 'onclick' &&
        // omit v-model handlers
        name !== 'onUpdate:modelValue' && // <input v-model="inputText" />，属性值prop
        // omit onVnodeXXX hooks
        !isReservedProp(name)
      ) {
        // v-on:change、mouseover...
        hasHydrationEventBinding = true
      }

      if (isEventHandler && isReservedProp(name)) {
        // ',key,ref,' +
        // 'onVnodeBeforeMount,onVnodeMounted,' +
        // 'onVnodeBeforeUpdate,onVnodeUpdated,' +
        // 'onVnodeBeforeUnmount,onVnodeUnmounted'
        hasVnodeHook = true
      }

      // v-on 指令，value type 默认 SIMPLE_EXPRESSION ConstantType =0，行内执行 COMPOUND_EXPRESSION ConstantType =0 ，修饰符 JS_CALL_EXPRESSION ConstantType = 0
      // v-bind 指令，SIMPLE_EXPRESSION ConstantType =0
      // v-model 指令，props: [属性名节点, 属性值节点, 修饰符节点]
      //     属性名的value type: SIMPLE_EXPRESSION ConstantType =0，属性值的value: COMPOUND_EXPRESSION ConstantType =0, 修饰符的value：SIMPLE_EXPRESSION ConstantType =0
      // v-html 指令，SIMPLE_EXPRESSION ConstantType =0
      // v-text 指令，JS_CALL_EXPRESSION ConstantType = 0
      if (
        value.type === NodeTypes.JS_CACHE_EXPRESSION || // 解析v-on指令时，如果设置了shouldCache，则 context.cache() 会生成JS_CACHE_EXPRESSION
        ((value.type === NodeTypes.SIMPLE_EXPRESSION ||
          value.type === NodeTypes.COMPOUND_EXPRESSION) &&
          getConstantType(value, context) > 0)
      ) {
        // skip if the prop is a cached handler or has constant value
        return
      }

      // 解析 v-on:click、 v-bind、v-model属性值

      if (name === 'ref') {
        hasRef = true
      } else if (name === 'class' && !isComponent) {
        hasClassBinding = true
      } else if (name === 'style' && !isComponent) {
        hasStyleBinding = true
      } else if (name !== 'key' && !dynamicPropNames.includes(name)) {
        // 静态指令属性名列表
        // 注意： v-model，template: '<input v-model="textInput" />'，v-model属性值节点的prop，key.content='onUpdate:modelValue'
        dynamicPropNames.push(name)
      }
    } else {
      // 动态节点
      hasDynamicKeys = true
    }
  }

  for (let i = 0; i < props.length; i++) {
    // static attribute
    const prop = props[i]
    if (prop.type === NodeTypes.ATTRIBUTE) {
      // dom 静态属性，节点光标位置、属性名、属性值
      const { loc, name, value } = prop
      let isStatic = true
      if (name === 'ref') {
        // 存在ref属性
        hasRef = true

        // TODO: analyze cfs
        // in inline mode there is no setupState object, so we can't use string
        // keys to set the ref. Instead, we need to transform it to pass the
        // acrtual ref instead.
        if (!__BROWSER__ && context.inline) {
          isStatic = false
        }
      }
      // skip :is on <component>
      if (name === 'is' && tag === 'component') {
        // 不处理静态is组件属性: <component is="HelloWorld" />
        continue
      }

      // 保存属性列表
      properties.push(
        // 创建静态prop属性对应的js形式属性对象objProp: {type, loc, key, value}
        createObjectProperty(
          // objProp.key: {type, loc, content, isStatic, constType }
          createSimpleExpression(
            // 创建 属性名表达式对象 （形如ast指令属性值节点的结构）
            name, // 静态属性名，如'style'、'class'
            true, // 静态属性
            getInnerRange(loc, 0, name.length) // 获取属性名的模版解析的光标位置信息
          ),
          // objProp.value: {type, loc, content, isStatic, constType }
          createSimpleExpression(
            // 创建 属性值表达式对象 （形如ast指令属性值节点的结构）
            value ? value.content : '',
            isStatic,
            value ? value.loc : loc
          )
        )
      )
    } else {
      // directives 指令属性，合并去重，转换处理指令

      const { name, arg, exp, loc } = prop
      const isBind = name === 'bind'
      const isOn = name === 'on'

      // skip v-slot - it is handled by its dedicated transform.
      // slot 有专门的transform插件处理
      if (name === 'slot') {
        if (!isComponent) {
          context.onError(
            createCompilerError(ErrorCodes.X_V_SLOT_MISPLACED, loc) // v-slot can only be used on components or <template> tags
          )
        }
        continue
      }
      // skip v-once - it is handled by its dedicated transform.
      // // v-once 有专门的transform插件处理
      if (name === 'once') {
        continue
      }
      // skip v-is and :is on <component>
      // 跳过is指令，如 template: <component :is='HelloWold' />，is 指令在resolveComponentType中解析
      if (
        name === 'is' || // v-is
        (isBind && tag === 'component' && isBindKey(arg, 'is')) // 绑定静态is属性，如 <component :is='HelloWold' />
      ) {
        continue
      }
      // skip v-on in SSR compilation
      // 跳过 ssr中的on指令
      if (isOn && ssr) {
        continue
      }

      // 跳过解析：slot、once、is、ssr下的on

      // 分析 v-on 与 v-bind 指令，v-on/v-bind 不带指令名表达式参数
      // 如 template: '<button v-bind="{name: 'btn-name', class: 'btn-class'}" v-on="{ mousedown: handleDown, mouseup: handleUp }"></button>'
      // special case for v-bind and v-on with no argument
      if (!arg && (isBind || isOn)) {
        hasDynamicKeys = true // 存在动态绑定参数指令
        if (exp) {
          // 存在属性值节点

          if (properties.length) {
            // 在v-bind/v-on之前如果存在属性，则需要先对之前的属性进行去重合并 dedupeProperties(properties)
            // 如：<span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></span>
            // 合并前两个属性：class="red"、:class="['blue', { green: true}]"
            mergeArgs.push(
              // createObjectExpression {
              //   type: NodeTypes.JS_OBJECT_EXPRESSION,
              //   loc,
              //   properties // 已经合并去重
              // }
              createObjectExpression(dedupeProperties(properties), elementLoc)
            )
            // 如果存在v-bind/v-on指令，之后都依据mergeArgs合并后的列表
            properties = []
          }
          if (isBind) {
            // 如：<span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></span>
            // 直接保存v-bind属性值节点
            mergeArgs.push(exp)
          } else {
            // v-on="obj" -> toHandlers(obj)
            // <button onclick="click1" @click="'click2'" v-on:click="'click3'"  v-on="{click: 'click4'}"></button>, parse ast时，会生成4个prop，1个name='onclick'， 3个 name='on'
            // 此刻：1个 prop.key.content = 'onclick，2个 prop.key.content = 'onClick'，mergeArgs[0]有两个元素
            mergeArgs.push({
              // v-on="{click: 'click4'}"
              type: NodeTypes.JS_CALL_EXPRESSION, // codegen 执行表达式
              loc,
              callee: context.helper(TO_HANDLERS), // TO_HANDLERS = Symbol('toHandlers')
              arguments: [exp] // 属性值
            })
          }
        } else {
          // 没有属性值，'<button v-bind v-on></button>'
          context.onError(
            createCompilerError(
              isBind
                ? ErrorCodes.X_V_BIND_NO_EXPRESSION // 缺少v-bind值表达式
                : ErrorCodes.X_V_ON_NO_EXPRESSION,
              loc
            )
          )
        }
        continue
      }

      // 解析指令：v-bind、v-on、v-model、v-html、v-text、v-show、v-cloak、用户自定义指令

      // tronsfrom 处理指令插件：directiveTransforms

      // 默认 compiler-core: directiveTransforms
      //     {
      //       on: transformOn, // 转换指令属性名、校验属性值、属性值节点为codegen节点，校验属性值js语法
      //       bind: transformBind, // 转换v-bind指令属性节点，如转换属性名为小驼峰、校验属性值
      //       model: transformModel // 解析dom/组件节点上 v-model指令，返回 { props: [属性名节点、属性值节点、修饰符节点]}，如校验属性值节点不能为空，属性值内容格式必须是一个有效的js变量应用：$_abc[foo][bar] 或 $_abc.foo.bar
      //     }
      // object.assign 覆盖上方默认
      // 用户 compiler-dom: DOMDirectiveTransforms
      //    {
      //      cloak: noopDirectiveTransform,  // 解析 v-cloak，返回空属性列表 { props: [] }
      //      html: transformVHtml,  // 解析 v-html指令，属性值必须存在，覆盖子内容
      //      text: transformVText,  //  解析 v-text指令，需要有属性值，覆盖节点子内容
      //      model: transformModel, // override compiler-core，进一步针对dom元素上的v-model，解析使用环境，如需在文本框中使用，并设置needRuntime，移除一些v-model属性名节点信息
      //      on: transformOn, // override compiler-core ，先执行compiler-core on 再处理指令修饰符modifiers，进一步转换属性值节点、属性名节点格式
      //      show: transformShow // 解析v-show，必须设置属性值，返回空属性列表[]，设置needRuntime
      //    }
      const directiveTransform = context.directiveTransforms[name] // 指令属性名，如 if、show、或 bind、on、slot等指令名
      if (directiveTransform) {
        // has built-in directive transform.
        // 处理vue内置指令， 转换属性节点格式
        // props 为codegen转换后
        const { props, needRuntime } = directiveTransform(prop, node, context)
        !ssr && props.forEach(analyzePatchFlag)
        // 保存属性props, prop为createObjectProperty(key, value)
        properties.push(...props)
        if (needRuntime) {
          // 如 v-model，指令使用环境type，如文本input V_MODEL_TEXT = Symbol(__DEV__ ? `vModelText` : ``)
          // 如 v-show，V_SHOW = Symbol(__DEV__ ? `vShow` : ``)
          runtimeDirectives.push(prop)
          if (isSymbol(needRuntime)) {
            // 开发环境下，唯一
            directiveImportMap.set(prop, needRuntime)
          }
        }
      } else {
        // 用户自定义指令列表
        // no built-in transform, this is a user custom directive.
        runtimeDirectives.push(prop)
      }
    }
  }

  // 转换后的属性列表节点
  let propsExpression: PropsExpression | undefined = undefined

  // has v-bind="object" or v-on="object", wrap with mergeProps
  if (mergeArgs.length) {
    // mergeArgs 由 v-bind/v-on （无指令参数）过程创建
    if (properties.length) {
      // 如：<span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}" style="color: blue" :style="{color: 'red'}"></span>
      // 在处理完v-bind/v-on属性之后，需要继续处理之后可能存在的重复属性
      mergeArgs.push(
        // createObjectExpression {
        //   type: NodeTypes.JS_OBJECT_EXPRESSION,
        //   loc,
        //   properties // 已经合并去重 dedupeProperties(properties)
        // }
        createObjectExpression(dedupeProperties(properties), elementLoc)
      )
    }
    if (mergeArgs.length > 1) {
      // 创建执行合并props函数
      propsExpression = createCallExpression(
        context.helper(MERGE_PROPS),
        mergeArgs,
        elementLoc
      )
    } else {
      // 元素节点属性 只有v-on或v-bind(无参数)一个属性，则不需要创建合并函数
      // 如 <span v-bind="{class: 'red'}"></span>
      // single v-bind with nothing else - no need for a mergeProps call
      propsExpression = mergeArgs[0] // 返回v-bind属性值节点、v-on createCallExpression节点
    }
  } else if (properties.length) {
    // 不存在v-on/v-bind(无参数)属性，同样需要合并去重属性
    // 如 <span class="red"></span>
    propsExpression = createObjectExpression(
      dedupeProperties(properties),
      elementLoc
    )
  }

  // 生成指定的patchFlag，通过二进制运算
  if (hasDynamicKeys) {
    // 存在动态指令参数 或 v-on/v-bind（无参数）指令
    patchFlag |= PatchFlags.FULL_PROPS
  } else {
    // 否则，只针对部分patch
    if (hasClassBinding) {
      // 存在class属性，非组件
      patchFlag |= PatchFlags.CLASS
    }
    if (hasStyleBinding) {
      // 存在v-bind:style属性，非组件
      patchFlag |= PatchFlags.STYLE
    }
    if (dynamicPropNames.length) {
      // 静态指令属性名列表，且非 ref、style、class，且该指令没有被设置缓存
      // 如：v-bind、 v-model、 v-on
      patchFlag |= PatchFlags.PROPS
    }
    if (hasHydrationEventBinding) {
      // dom添加其它事件绑定 或 prop转换后以on开头的事件(如v-model)： 非组件且以on开头，但不包括click事件，非vnodehook事件
      patchFlag |= PatchFlags.HYDRATE_EVENTS
    }
  }
  if (
    (patchFlag === 0 || patchFlag === PatchFlags.HYDRATE_EVENTS) &&
    (hasRef || hasVnodeHook || runtimeDirectives.length > 0)
  ) {
    patchFlag |= PatchFlags.NEED_PATCH
  }

  return {
    props: propsExpression, // 属性列表节点， 已处理所有属性包括静态属性、静态/动态指令属性，并进行了合并去重处理
    directives: runtimeDirectives, // 运行时的指令
    patchFlag,
    dynamicPropNames // 静态指令属性名列表，且非 ref、style、class，且该指令没有被设置缓存
  }
}

// 属性合并去重
// Dedupe props in an object literal.
// Literal duplicated attributes would have been warned during the parse phase,
// however, it's possible to encounter duplicated `onXXX` handlers with different
// modifiers. We also need to merge static and dynamic class / style attributes.
// - onXXX handlers / style: merge into array
// - class: merge into single expression with concatenation
function dedupeProperties(properties: Property[]): Property[] {
  const knownProps: Map<string, Property> = new Map()
  const deduped: Property[] = [] // 合并去重后的属性列表

  for (let i = 0; i < properties.length; i++) {
    // prop节点由createObjectProperty(key, value) 创建
    const prop = properties[i]

    // dynamic keys are always allowed
    if (prop.key.type === NodeTypes.COMPOUND_EXPRESSION || !prop.key.isStatic) {
      deduped.push(prop)
      continue
    }

    // <span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></span>
    const name = prop.key.content

    const existing = knownProps.get(name) // 属性名js表达式对象
    if (existing) {
      // 如果已经存在，则创建新属性值节点并合并属性值
      if (name === 'style' || name === 'class' || name.startsWith('on')) {
        // 合并属性值内容：existing.value = {
        //   type: NodeTypes.JS_ARRAY_EXPRESSION,
        //   loc,
        //   elements  // elements = [existing.value, prop.value]
        // }
        mergeAsArray(existing, prop)
      }
      // unexpected duplicate, should have emitted error during parse
    } else {
      knownProps.set(name, prop) // 添加
      deduped.push(prop) // 添加
    }
  }
  return deduped
}

/**
 * 合并prop属性值节点
 * @param existing 已处理的prop属性节点
 * @param incoming 待处理的prop属性节点
 */
function mergeAsArray(existing: Property, incoming: Property) {
  // <span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></span>
  // 已处理 class="red"、待处理 :class="['blue', { green: true}]"
  if (existing.value.type === NodeTypes.JS_ARRAY_EXPRESSION) {
    existing.value.elements.push(incoming.value)
  } else {
    // existing.value = {
    //   type: NodeTypes.JS_ARRAY_EXPRESSION,
    //   loc,
    //   elements
    // }
    existing.value = createArrayExpression(
      [existing.value, incoming.value],
      existing.loc
    )
  }
}

// 进一步解析 buildProps() 中的 runtimeDirectives：v-show、v-model、用户自定义指令
// 解析指令参数、指令值、指令修饰符
function buildDirectiveArgs(
  dir: DirectiveNode, // 解析后的指令节点：key/value
  context: TransformContext
): ArrayExpression {
  const dirArgs: ArrayExpression['elements'] = []

  // 内置的运行时指令
  const runtime = directiveImportMap.get(dir)

  if (runtime) {
    // 在 buildProps 中设置directiveImportMap：v-show、v-model 相关指令的运行函数
    // 如 v-model，指令使用环境type，如文本input V_MODEL_TEXT = Symbol(__DEV__ ? `vModelText` : ``)
    // built-in directive with runtime
    dirArgs.push(context.helperString(runtime)) // 保存对应的运行时函数名，如 '_vModelText'
  } else {
    // 用户自定义指令
    // user directive.
    // see if we have directives exposed via <script setup>
    const fromSetup = !__BROWSER__ && resolveSetupReference(dir.name, context)
    if (fromSetup) {
      // TODO: analyze cfs
      dirArgs.push(fromSetup)
    } else {
      // inject statement for resolving directive
      context.helper(RESOLVE_DIRECTIVE) // Symbol(__DEV__ ? `resolveDirective` : ``)
      context.directives.add(dir.name) // 添加指令名
      dirArgs.push(toValidAssetId(dir.name, `directive`)) // [^A-Za-z0-9_]， 如自定义： v-click-out，name='click-out' 转换为 '_directive_click_out'
    }
  }
  const { loc } = dir
  if (dir.exp) dirArgs.push(dir.exp) // 指令值节点表达式
  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push(`void 0`) // 没有值，如用户定义的指令
    }
    dirArgs.push(dir.arg) // 指令参数节点
  }
  if (Object.keys(dir.modifiers).length) {
    // 修饰符节点
    if (!dir.arg) {
      // 无参数节点
      if (!dir.exp) {
        // 无属性值：'<span v-click-me></span>'
        dirArgs.push(`void 0`)
      }
      // 如 '<span v-click-me="true"></span>'
      dirArgs.push(`void 0`)
    }
    // 创建指令对应的修饰符列表节点
    const trueExpression = createSimpleExpression(`true`, false, loc)
    dirArgs.push(
      createObjectExpression(
        dir.modifiers.map(modifier =>
          createObjectProperty(modifier, trueExpression)
        ),
        loc
      )
    )
  }
  // 返回指令参数节点
  return createArrayExpression(dirArgs, dir.loc)
}

function stringifyDynamicPropNames(props: string[]): string {
  let propsNamesString = `[`
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i])
    if (i < l - 1) propsNamesString += ', '
  }
  return propsNamesString + `]`
}
