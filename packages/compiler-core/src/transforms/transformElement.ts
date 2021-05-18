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
import {
  checkCompatEnabled,
  CompilerDeprecationTypes,
  isCompatEnabled
} from '../compat/compatConfig'

// some directive transforms (e.g. v-model) may return a symbol for runtime
// import, which should be used instead of a resolveDirective call.
// 运行时的指令导入，如 v-model、v-show
const directiveImportMap = new WeakMap<DirectiveNode, symbol>()

// generate a JavaScript AST for this element's codegen
// 解析元素节点的prop属性列表、v-slot指令、patchFlag信息、用户定义的指令等，为当前节点的ast生成对应的codegen vnode执行函数节点
export const transformElement: NodeTransform = (node, context) => {
  // perform the work on exit, after all child expressions have been
  // processed and merged.
  // 由于当前节点的transform插件列表是先添加后执行，所以会在当前节点的子节点经过 transformText即文本内容合并后，再执行这个插件
  return function postTransformElement() {
    node = context.currentNode!

    if (
      !(
        node.type === NodeTypes.ELEMENT &&
        (node.tagType === ElementTypes.ELEMENT ||
          node.tagType === ElementTypes.COMPONENT)
      )
    ) {
      return
    }

    // 分析标签元素：html标签元素、组件标签元素
    const { tag, props } = node // node.type ELEMENT 类型节点: dom元素、 组件节点
    const isComponent = node.tagType === ElementTypes.COMPONENT //  当前节点为组件类型

    // The goal of the transform is to create a codegenNode implementing the
    // VNodeCall interface.
    // 该transform插件主要是为了创建 codegenNode 信息，为了在vnode时调用

    // 解析组件is指令，如果dom标签有v-is指令，则也是组件

    // 解析组件类型，返回相关内容，如动态is组件的 vnode patch方法、内置组件名、区分用户自定义组件名
    let vnodeTag = isComponent
      ? resolveComponentType(node as ComponentNode, context) // 解析is属性: 静态属性is、静态指令属性:is、v-is，返回一个对象
      : `"${tag}"` // dom 元素标签名

    // 是否是动态组件，即存在静态is、:is、v-is
    const isDynamicComponent =
      isObject(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT

    let vnodeProps: VNodeCall['props']

    // 保存节点的子元素列表：
    //    节点是非KeepAlive/TELEPORT的组件，转换为slot节点列表；
    //    或 节点非组件或为keep-alive，且唯一子节点是动态文本或普通文本；
    //    或 节点非组件或为keep-alive，且唯一子节点不是动态文本和普通文本；
    //    或 节点非组件有多个子节点；
    //    或 节点是TELEPORT组件
    let vnodeChildren: VNodeCall['children']

    let vnodePatchFlag: VNodeCall['patchFlag']

    let patchFlag: number = 0
    let vnodeDynamicProps: VNodeCall['dynamicProps']
    let dynamicPropNames: string[] | undefined // 静态prop key的name列表
    let vnodeDirectives: VNodeCall['directives']

    let shouldUseBlock =
      // dynamic component may resolve to plain elements
      isDynamicComponent || // 动态组件 即存在is属性
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
          findProp(node, 'key', true))) //  绑定了key指令： ':key'，非静态属性

    // 节点 props

    if (props.length > 0) {
      // 解析属性列表：静态属性、指令属性
      // 指令属性：v-bind、v-on、v-model、v-html、v-text、v-show、v-cloak、用户自定义指令; 跳过解析：slot、once、is、ssr下的on
      // 属性去重合并，转换key/value
      // 设置node的 patchFlag
      const propsBuildResult = buildProps(node, context)

      vnodeProps = propsBuildResult.props // 解析后的props列表
      patchFlag = propsBuildResult.patchFlag // 根据相关prop信息，进行二进制运算设置patchFlag
      dynamicPropNames = propsBuildResult.dynamicPropNames // 静态prop key的name列表，且非 ref、style、class，且该指令没有被设置缓存，如：v-bind、 v-model、 v-on

      const directives = propsBuildResult.directives // 需要在运行时，重新处理的：v-model、v-show、用户自定义指令
      vnodeDirectives =
        directives && directives.length
          ? (createArrayExpression(
              directives.map(dir => buildDirectiveArgs(dir, context)) // 进一步解析 buildProps() 中的 runtimeDirectives：v-show、v-model、用户自定义指令；处理要运行的指令的参数、值、修饰符
            ) as DirectiveArguments)
          : undefined
    }

    // 节点 children

    // keep-alive 不可以有多个子元素
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

      // 处理组件slot、解析节点的 vnodeChildren：
      //    情况一：解析组件（不包括 TELEPORT、KEEP_ALIVE）
      //    情况二：节点只有一个子节点：
      //          解析 普通dom元素
      //          解析 KEEP_ALIVE 组件 ，如 template: '<keep-alive><div>...</div></keep-alive>'
      //    情况三：节点有多个子节点；或 解析 TELEPORT 组件

      // 处理组件的slot信息，如v-slot指令，非 teleport、keep-alive组件（不是真实的组件）
      const shouldBuildAsSlots =
        isComponent && // 组件类型的节点
        // Teleport is not a real component and has dedicated runtime handling
        // Teleport、keep-alive 均不是一个真实的组件，且已经有专门的运行时处理逻辑
        vnodeTag !== TELEPORT &&
        // explained above.
        vnodeTag !== KEEP_ALIVE

      // 解析组件（不包括 TELEPORT、KEEP_ALIVE）
      if (shouldBuildAsSlots) {
        // 创建组件及子元素的slots节点列表（并在此处理v-slot的v-if/for）
        // slots: 组件的slots节点列表：静态节点列表、动态节点列表
        // hasDynamicSlots 是否存在动态 slot: 如 动态v-slot:[xxx]、或 <template v-slot... v-if/v-for>、或 嵌套v-if/v-for
        const { slots, hasDynamicSlots } = buildSlots(node, context)

        vnodeChildren = slots
        if (hasDynamicSlots) {
          // 设置 vnode diff patchFlag
          patchFlag |= PatchFlags.DYNAMIC_SLOTS
        }
      } else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
        // 如果节点只有一个子节点：
        //    是非组件，即普通dom元素
        //    是组件且为KEEP_ALIVE，如 template: '<keep-alive><div>...</div></keep-alive>'

        const child = node.children[0]
        const type = child.type
        // check for dynamic text children
        // 子节点是动态文本，即存在插值 {{ }}
        const hasDynamicTextChild =
          type === NodeTypes.INTERPOLATION ||
          type === NodeTypes.COMPOUND_EXPRESSION // 既有普通文本，也有插值文本，由transformText生成
        if (
          hasDynamicTextChild &&
          getConstantType(child, context) === ConstantTypes.NOT_CONSTANT // 判断子元素包括混合连续列表里的子文本元素，是否有文本节点为NOT_CONSTANT类型
        ) {
          // 设置 patchflag
          patchFlag |= PatchFlags.TEXT
        }
        // pass directly if the only child is a text node
        // (plain / interpolation / expression)
        if (hasDynamicTextChild || type === NodeTypes.TEXT) {
          // 节点非组件或为keep-alive，且唯一子节点是动态文本或普通文本
          // 如 template: '<div>123 {{ someValue }}</div>'
          vnodeChildren = child as TemplateTextChildNode
        } else {
          // 节点非组件或为keep-alive，且唯一子节点不是动态文本和普通文本
          // 如 template: '<keep-alive><div>...</div></keep-alive>'
          vnodeChildren = node.children // 保存当前子节点
        }
      } else {
        // 当前节点为 普通dom元素且有多个子节点；
        // 或是TELEPORT组件
        vnodeChildren = node.children
      }
    }

    // 节点 patchFlags

    // patchFlag & dynamicPropNames
    if (patchFlag !== 0) {
      // 存在需要针对性的patch vnode diff
      if (__DEV__) {
        if (patchFlag < 0) {
          // HOISTED = -1
          // BAIL = -2
          // special flags (negative and mutually exclusive)
          vnodePatchFlag = patchFlag + ` /* ${PatchFlagNames[patchFlag]} */`
        } else {
          // bitwise flags
          const flagNames = Object.keys(PatchFlagNames)
            .map(Number)
            .filter(n => n > 0 && patchFlag & n) // 进行 按位与 操作， 取出对应的patchFlag值 （patchFlag 初始为0，通过 按位或 变更）
            .map(n => PatchFlagNames[n]) // 对应的名字
            .join(`, `)
          vnodePatchFlag = patchFlag + ` /* ${flagNames} */` // 记录需要进行vnode diff 的patchflag和其开发帮助的文本信息
        }
      } else {
        // 非开发环境下，只需要数字提示
        vnodePatchFlag = String(patchFlag)
      }
      if (dynamicPropNames && dynamicPropNames.length) {
        // 字符串拼接 动态prop(经解析过的指令节点)的属性名，不包括 ref、class、style
        // 如，template: '<input ref="input" v-model="textInput" v-bind:class="'red'" :placeholder="'请输入'" />'
        // 则，dynamicPropNames: ["onUpdate:modelValue", "placeholder"]
        // 返回结果： '["onUpdate:modelValue", "placeholder"]'
        vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames)
      }
    }

    // 创建vnode的运行函数
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag, // 解析后的标签名：自定义 <hello-world> => _component_hello_world 、内置 transition => Symbol(__DEV__ ? `Transition` : ``)
      vnodeProps, // 节点props属性列表， 已处理所有属性包括静态属性、静态/动态指令属性，并进行了合并去重处理；且均转换为相应节点格式
      vnodeChildren, // 节点的子元素列表，如果是组件（非teleport/keep-alive） 则需要转换为slot节点列表，并替换原先子元素列表；或则直接保存对应的子元素列表
      vnodePatchFlag, // patchFlag和及其描述文本信息: patchFlag + ` /* ${flagNames} */`
      vnodeDynamicProps, // 静态指令prop的属性名(解析过的指令节点)，字符串拼接格式： 如: template: '<input v-model="textInput" :placeholder="'请输入'" />'  对应的结果为： '["onUpdate:modelValue", "placeholder"]'
      vnodeDirectives, // 需要在运行时，重新处理的指令，如：v-model、v-show、用户自定义指令
      !!shouldUseBlock, // 是否使用block，如：动态is组件或TELEPORT或SUSPENSE；或是非组件当是特殊标签如svg，普通元素绑定了动态 :key； 或是 keep-alive组件，注意for节点/if节点(transform vIf)、root节点（transform createRootCodegen）
      false /* disableTracking */, // 默认 false
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
  let { tag } = node

  // 1. dynamic component
  // 存在is属性（动态组件）
  const isExplicitDynamic = isComponentTag(tag)
  const isProp =
    findProp(node, 'is') || (!isExplicitDynamic && findDir(node, 'is'))
  if (isProp) {
    // 如 存在属性is：'<component is="HelloWorld" />' 或 '<component :is="HelloWorld" />'
    // 或 存在指令is：'<hello-world v-is="Welcome" />'

    if (!isExplicitDynamic && isProp.type === NodeTypes.ATTRIBUTE) {
      // <button is="vue:xxx">
      // if not <component>, only is value that starts with "vue:" will be
      // treated as component by the parse phase and reach here, unless it's
      // compat mode where all is values are considered components
      tag = isProp.value!.content.replace(/^vue:/, '')
    } else {
      const exp =
        isProp.type === NodeTypes.ATTRIBUTE // 静态dom属性
          ? isProp.value && createSimpleExpression(isProp.value.content, true) // 转换为指令值节点格式
          : isProp.exp // 指令值节点
      if (exp) {
        // 创建一个类型为 JS_CALL_EXPRESSION 的渲染源码树codegen节点
        // Symbol(`resolveDynamicComponent`) 为执行的方法 callee
        return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
          exp
        ])
      }
    }
  }

  // 2. built-in components (Teleport, Transition, KeepAlive, Suspense...)
  // 如果是内置组件，直接返回，如核心组件tag：keep-alive 或 KeepAlive；或内置组件 transition
  const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag)
  if (builtIn) {
    // built-ins are simply fallthroughs / have special handling during ssr
    // so we don't need to import their runtime equivalents
    if (!ssr) context.helper(builtIn)
    return builtIn // 内置属性返回相应的标识符，如 KEEP_ALIVE = Symbol(__DEV__ ? `KeepAlive` : ``)
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
  if (
    !__BROWSER__ &&
    context.selfName &&
    capitalize(camelize(tag)) === context.selfName
  ) {
    context.helper(RESOLVE_COMPONENT)
    // codegen.ts has special check for __self postfix when generating
    // component imports, which will pass additional `maybeSelfReference` flag
    // to `resolveComponent`.
    context.components.add(tag + `__self`)
    return toValidAssetId(tag, `component`)
  }

  // 5. user component (resolve)
  //用户自定义组件
  context.helper(RESOLVE_COMPONENT) // 收集渲染源码要用的辅助函数，在渲染源码开始处定义这些函数，为了之后执行渲染函数时正确引用这些的函数
  context.components.add(tag) // 保存 组件标签名
  return toValidAssetId(tag, `component`) // 格式话组件名 如 tag = 'hello world' 转换为 '_component_hello__world'
}

// TODO: analyze cfs
function resolveSetupReference(name: string, context: TransformContext) {
  const bindings = context.bindingMetadata
  if (!bindings || bindings.__isScriptSetup === false) {
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
  node: ElementNode, // dom元素节点 或组件节点 或 slot标签节点（在transformSlot中）
  context: TransformContext,
  props: ElementNode['props'] = node.props, // 节点上的属性列表
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
      // 静态属性指令

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
      // 注意 静态style 已经被转换为动态style，即 style="color: blue;" 转换为 :style='{"color": "blue"}'
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
      // skip is on <component>, or is="vue:xxx"
      if (
        name === 'is' &&
        (isComponentTag(tag) || (value && value.content.startsWith('vue:')))
      ) {
        // 跳过 <component>, 或者 is="vue:xxx"
        continue
      }

      // 保存属性列表
      properties.push(
        // 创建静态prop属性对应的js形式属性对象objProp: {type, loc, key, value}
        createObjectProperty(
          // objProp.key: {type, loc, content, isStatic, constType }
          createSimpleExpression(
            // 创建 属性名表达式对象 （形如ast指令属性值节点的结构）
            name, // 静态属性名，'class'
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
      const isVBind = name === 'bind'
      const isVOn = name === 'on'

      // skip v-slot - it is handled by its dedicated transform.
      // v-slot 有专门的transform插件处理：在transformElement中解析 buildSlots()，由directivesSlot插件解析
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
        name === 'is' ||
        (isVBind && isComponentTag(tag) && isBindKey(arg, 'is')) // 绑定静态is属性，如 <component :is='HelloWold' />
      ) {
        continue
      }
      // skip v-on in SSR compilation
      // 跳过 ssr中的on指令
      if (isVOn && ssr) {
        continue
      }

      // 跳过解析：slot、once、is、ssr下的on

      // 分析 v-on 与 v-bind 指令，v-on/v-bind 不带指令名表达式参数
      // 如 template: '<button v-bind="{name: 'btn-name', class: 'btn-class'}" v-on="{ mousedown: handleDown, mouseup: handleUp }"></button>'
      // special case for v-bind and v-on with no argument
      if (!arg && (isVBind || isVOn)) {
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

          if (isVBind) {
            // 如：<span class="red" :class="['blue', { green: true}]" v-bind="{ class: 'yellow'}"></span>
            // 直接保存v-bind属性值节点

            if (__COMPAT__) {
              // 2.x v-bind object order compat
              if (__DEV__) {
                const hasOverridableKeys = mergeArgs.some(arg => {
                  if (arg.type === NodeTypes.JS_OBJECT_EXPRESSION) {
                    return arg.properties.some(({ key }) => {
                      if (
                        key.type !== NodeTypes.SIMPLE_EXPRESSION ||
                        !key.isStatic
                      ) {
                        return true
                      }
                      return (
                        key.content !== 'class' &&
                        key.content !== 'style' &&
                        !isOn(key.content)
                      )
                    })
                  } else {
                    // dynamic expression
                    return true
                  }
                })
                if (hasOverridableKeys) {
                  checkCompatEnabled(
                    CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER,
                    context,
                    loc
                  )
                }
              }

              if (
                isCompatEnabled(
                  CompilerDeprecationTypes.COMPILER_V_BIND_OBJECT_ORDER,
                  context
                )
              ) {
                mergeArgs.unshift(exp)
                continue
              }
            }

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
              isVBind
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
      // 解析指令: on、bind、model、html、text、show、cloak，注意其它指令v-if/v-for/slot等 transform会注入特有属性injectProps，比如key
      const directiveTransform = context.directiveTransforms[name]
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

    if (
      __COMPAT__ &&
      prop.type === NodeTypes.ATTRIBUTE &&
      prop.name === 'ref' &&
      context.scopes.vFor > 0 &&
      checkCompatEnabled(
        CompilerDeprecationTypes.COMPILER_V_FOR_REF,
        context,
        prop.loc
      )
    ) {
      properties.push(
        createObjectProperty(
          createSimpleExpression('refInFor', true),
          createSimpleExpression('true', false)
        )
      )
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
      propsExpression = mergeArgs[0] // v-bind 属性值节点 SIMPLE_EXPRESSION、 v-on 属性值节点 createCallExpression
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
      // 动态属性：静态指令属性名列表，且非 ref、style、class，且该指令没有被设置缓存
      // 如：v-bind、 v-model （onUpdate:modelValue）、 v-on
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

// 解析构建指令节点，v-show、v-model、用户自定义指令
// 解析其中： 指令名、指令值、指令参数、参数修饰符
function buildDirectiveArgs(
  dir: DirectiveNode, // 解析后的指令节点：key/value
  context: TransformContext
): ArrayExpression {
  const dirArgs: ArrayExpression['elements'] = []

  // 内置的运行时指令
  const runtime = directiveImportMap.get(dir)

  // 指令名

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

  // 指令值 - 指令处理事件

  if (dir.exp) dirArgs.push(dir.exp) // 指令值节点表达式

  // 指令参数

  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push(`void 0`) // 没有值，如用户定义的指令
    }
    dirArgs.push(dir.arg) // 指令参数节点
  }

  // 指令修饰符

  if (Object.keys(dir.modifiers).length) {
    // 修饰符节点
    if (!dir.arg) {
      // 无指令参数节点
      if (!dir.exp) {
        // 无指令值：'<span v-click-me></span>'
        dirArgs.push(`void 0`)
      }
      // 如 '<span v-click-me="true"></span>'
      dirArgs.push(`void 0`)
    }
    // 创建指令对应的修饰符列表节点
    const trueExpression = createSimpleExpression(`true`, false, loc)
    dirArgs.push(
      // 创建一个 对象格式 的来保存修饰符列表值
      createObjectExpression(
        dir.modifiers.map(modifier =>
          createObjectProperty(modifier, trueExpression)
        ),
        loc
      )
    )
  }

  // 返回自定义指令节点
  return createArrayExpression(dirArgs, dir.loc)
}

// 字符串拼接 静态prop(经解析过的指令节点)的属性名，不包括 ref、class、style
// 如，template: '<input ref="input" v-model="textInput" v-bind:class="'red'" :placeholder="'请输入'" />'
// 则，dynamicPropNames: ["onUpdate:modelValue", "placeholder"]
// 返回结果： '["onUpdate:modelValue", "placeholder"]'
function stringifyDynamicPropNames(props: string[]): string {
  let propsNamesString = `[`
  for (let i = 0, l = props.length; i < l; i++) {
    propsNamesString += JSON.stringify(props[i])
    if (i < l - 1) propsNamesString += ', '
  }
  return propsNamesString + `]`
}

function isComponentTag(tag: string) {
  return tag[0].toLowerCase() + tag.slice(1) === 'component'
}
