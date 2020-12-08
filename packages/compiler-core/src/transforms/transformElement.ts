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

    // 解析组件类型，返回相关内容，如动态is组件的 vnode patch方法、内置组件名、区分用户自定义组件名
    const vnodeTag = isComponent
      ? resolveComponentType(node as ComponentNode, context)
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

    // props 节点属性列表：dom属性、指令属性
    if (props.length > 0) {
      const propsBuildResult = buildProps(node, context)
      vnodeProps = propsBuildResult.props
      patchFlag = propsBuildResult.patchFlag
      dynamicPropNames = propsBuildResult.dynamicPropNames
      const directives = propsBuildResult.directives
      vnodeDirectives =
        directives && directives.length
          ? (createArrayExpression(
              directives.map(dir => buildDirectiveArgs(dir, context))
            ) as DirectiveArguments)
          : undefined
    }

    // children
    if (node.children.length > 0) {
      if (vnodeTag === KEEP_ALIVE) {
        // Although a built-in component, we compile KeepAlive with raw children
        // instead of slot functions so that it can be used inside Transition
        // or other Transition-wrapping HOCs.
        // To ensure correct updates with block optimizations, we need to:
        // 1. Force keep-alive into a block. This avoids its children being
        //    collected by a parent block.
        shouldUseBlock = true
        // 2. Force keep-alive to always be updated, since it uses raw children.
        patchFlag |= PatchFlags.DYNAMIC_SLOTS
        if (__DEV__ && node.children.length > 1) {
          context.onError(
            createCompilerError(ErrorCodes.X_KEEP_ALIVE_INVALID_CHILDREN, {
              start: node.children[0].loc.start,
              end: node.children[node.children.length - 1].loc.end,
              source: ''
            })
          )
        }
      }

      const shouldBuildAsSlots =
        isComponent &&
        // Teleport is not a real component and has dedicated runtime handling
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

// 解析组件类型，返回相关内容，如动态is组件的 vnode patch方法、内置组件名、区分用户自定义组件名
export function resolveComponentType(
  node: ComponentNode, // 当前节点 即组件节点
  context: TransformContext, // transform 上下文
  ssr = false
) {
  const { tag } = node // 组件标签名

  // 1. dynamic component
  const isProp =
    node.tag === 'component' ? findProp(node, 'is') : findDir(node, 'is') // 查找 is 指令，并返回is指令属性节点; findProp 查找属性静态或bind静态属性； findDir查找指令，不是静态dom
  if (isProp) {
    // 注意： 如 template = '<HelloWorld is="Welcome" />' 则不符合此条件
    const exp =
      isProp.type === NodeTypes.ATTRIBUTE // dom静态is属性，如 '<component is="HelloWorld" />'
        ? isProp.value && createSimpleExpression(isProp.value.content, true) // 返回属性值相应的表达式对象
        : isProp.exp // 指令形式is属性，如 '<component :is="HelloWorld" />'
    if (exp) {
      // 创建 is属性值表达式对应的组件patch方法：Symbol(`resolveDynamicComponent`)
      return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
        exp
      ])
    }
  }

  // 2. built-in components (Teleport, Transition, KeepAlive, Suspense...)
  // 如果是内置组件，直接返回
  const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag)
  if (builtIn) {
    // built-ins are simply fallthroughs / have special handling during ssr
    // so we don't need to import their runtime equivalents
    if (!ssr) context.helper(builtIn)
    return builtIn
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
  return toValidAssetId(tag, `component`) // 如 tag = 'hello  world' 转换为 '_component_hello__world'
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

export function buildProps(
  node: ElementNode, // dom元素节点 或组件节点
  context: TransformContext,
  props: ElementNode['props'] = node.props,
  ssr = false
): {
  props: PropsExpression | undefined
  directives: DirectiveNode[]
  patchFlag: number
  dynamicPropNames: string[]
} {
  const { tag, loc: elementLoc } = node
  const isComponent = node.tagType === ElementTypes.COMPONENT // 是否是组件
  let properties: ObjectExpression['properties'] = [] // 存储props对应的js结构对象：每个元素key、value的形式如 指令值形式
  const mergeArgs: PropsExpression[] = []
  const runtimeDirectives: DirectiveNode[] = []

  // patchFlag analysis
  let patchFlag = 0
  let hasRef = false // 节点是否存在ref属性
  let hasClassBinding = false
  let hasStyleBinding = false
  let hasHydrationEventBinding = false
  let hasDynamicKeys = false
  let hasVnodeHook = false
  const dynamicPropNames: string[] = []

  const analyzePatchFlag = ({ key, value }: Property) => {
    if (isStaticExp(key)) {
      const name = key.content
      const isEventHandler = isOn(name)
      if (
        !isComponent &&
        isEventHandler &&
        // omit the flag for click handlers because hydration gives click
        // dedicated fast path.
        name.toLowerCase() !== 'onclick' &&
        // omit v-model handlers
        name !== 'onUpdate:modelValue' &&
        // omit onVnodeXXX hooks
        !isReservedProp(name)
      ) {
        hasHydrationEventBinding = true
      }

      if (isEventHandler && isReservedProp(name)) {
        hasVnodeHook = true
      }

      if (
        value.type === NodeTypes.JS_CACHE_EXPRESSION ||
        ((value.type === NodeTypes.SIMPLE_EXPRESSION ||
          value.type === NodeTypes.COMPOUND_EXPRESSION) &&
          getConstantType(value, context) > 0)
      ) {
        // skip if the prop is a cached handler or has constant value
        return
      }
      if (name === 'ref') {
        hasRef = true
      } else if (name === 'class' && !isComponent) {
        hasClassBinding = true
      } else if (name === 'style' && !isComponent) {
        hasStyleBinding = true
      } else if (name !== 'key' && !dynamicPropNames.includes(name)) {
        dynamicPropNames.push(name)
      }
    } else {
      hasDynamicKeys = true
    }
  }

  for (let i = 0; i < props.length; i++) {
    // static attribute
    const prop = props[i]
    if (prop.type === NodeTypes.ATTRIBUTE) {
      // dom 静态属性，模版位置、属性名、属性值
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

      properties.push(
        // 创建此prop属性对应的js形式属性对象objProp: {type, loc, key, value}
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
      // directives 指令属性
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
      // 跳过is指令，如 template: <component :is='HelloWold' />
      if (
        name === 'is' ||
        (isBind && tag === 'component' && isBindKey(arg, 'is')) // 绑定静态is属性，如 <component :is='HelloWold' />
      ) {
        continue
      }
      // skip v-on in SSR compilation
      // 跳过 ssr中的on指令
      if (isOn && ssr) {
        continue
      }

      // special case for v-bind and v-on with no argument
      // v-on/v-bind 不带指令名表达式参数 如 template: '<button v-bind="{name: 'btn-name', class: 'btn-class'}" v-on="{ mousedown: handleDown, mouseup: handleUp }"></button>'
      if (!arg && (isBind || isOn)) {
        hasDynamicKeys = true // 存在动态绑定参数指令
        if (exp) {
          // 属性值节点
          if (properties.length) {
            // TODO 属性合并去重属性
            mergeArgs.push(
              createObjectExpression(dedupeProperties(properties), elementLoc)
            )
            properties = []
          }
          if (isBind) {
            // <button class="red" :class="'green'" v-bind="{class: 'blue'}"></button> 有3个prop，第3个bind的arg=undefined
            mergeArgs.push(exp) // v-bind="{class: 'blue'}"
          } else {
            // v-on="obj" -> toHandlers(obj)
            // <button onclick="click1" @click="'click2'" v-on:click="'click3'"  v-on="{click: 'click4'}"></button>, parse ast时，会生成4个prop，1个name='onclick'， 3个 name='on'
            mergeArgs.push({
              // v-on="{click: 'click4'}"
              type: NodeTypes.JS_CALL_EXPRESSION, // 执行表达式
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

      const directiveTransform = context.directiveTransforms[name] // 指令属性名，如 if、show、或 bind、on、slot等指令名
      if (directiveTransform) {
        // has built-in directive transform.
        const { props, needRuntime } = directiveTransform(prop, node, context)
        !ssr && props.forEach(analyzePatchFlag)
        properties.push(...props)
        if (needRuntime) {
          runtimeDirectives.push(prop)
          if (isSymbol(needRuntime)) {
            directiveImportMap.set(prop, needRuntime)
          }
        }
      } else {
        // no built-in transform, this is a user custom directive.
        runtimeDirectives.push(prop)
      }
    }
  }

  let propsExpression: PropsExpression | undefined = undefined

  // has v-bind="object" or v-on="object", wrap with mergeProps
  if (mergeArgs.length) {
    if (properties.length) {
      mergeArgs.push(
        createObjectExpression(dedupeProperties(properties), elementLoc)
      )
    }
    if (mergeArgs.length > 1) {
      propsExpression = createCallExpression(
        context.helper(MERGE_PROPS),
        mergeArgs,
        elementLoc
      )
    } else {
      // single v-bind with nothing else - no need for a mergeProps call
      propsExpression = mergeArgs[0]
    }
  } else if (properties.length) {
    propsExpression = createObjectExpression(
      dedupeProperties(properties),
      elementLoc
    )
  }

  // patchFlag analysis
  if (hasDynamicKeys) {
    patchFlag |= PatchFlags.FULL_PROPS
  } else {
    if (hasClassBinding) {
      patchFlag |= PatchFlags.CLASS
    }
    if (hasStyleBinding) {
      patchFlag |= PatchFlags.STYLE
    }
    if (dynamicPropNames.length) {
      patchFlag |= PatchFlags.PROPS
    }
    if (hasHydrationEventBinding) {
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
    props: propsExpression,
    directives: runtimeDirectives,
    patchFlag,
    dynamicPropNames
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
    const prop = properties[i] // js对象属性objProp: {type, loc, key, value}，key/value为属性名/属性值对应的js表达式对象：{type, loc, content, isStatic, constType }
    // dynamic keys are always allowed
    // 属性名是动态key时，不需要合并去重
    if (prop.key.type === NodeTypes.COMPOUND_EXPRESSION || !prop.key.isStatic) {
      deduped.push(prop)
      continue
    }
    const name = prop.key.content // 属性名，如 class、style
    const existing = knownProps.get(name) // 属性名js表达式对象
    // 如：template=`<button class="red" onclick="handleClick" v-on="{class: 'blue', click: 'handlClick'}"></button>`
    if (existing) {
      if (name === 'style' || name === 'class' || name.startsWith('on')) {
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

function mergeAsArray(existing: Property, incoming: Property) {
  if (existing.value.type === NodeTypes.JS_ARRAY_EXPRESSION) {
    existing.value.elements.push(incoming.value)
  } else {
    existing.value = createArrayExpression(
      [existing.value, incoming.value],
      existing.loc
    )
  }
}

function buildDirectiveArgs(
  dir: DirectiveNode,
  context: TransformContext
): ArrayExpression {
  const dirArgs: ArrayExpression['elements'] = []
  const runtime = directiveImportMap.get(dir)
  if (runtime) {
    // built-in directive with runtime
    dirArgs.push(context.helperString(runtime))
  } else {
    // user directive.
    // see if we have directives exposed via <script setup>
    const fromSetup = !__BROWSER__ && resolveSetupReference(dir.name, context)
    if (fromSetup) {
      dirArgs.push(fromSetup)
    } else {
      // inject statement for resolving directive
      context.helper(RESOLVE_DIRECTIVE)
      context.directives.add(dir.name)
      dirArgs.push(toValidAssetId(dir.name, `directive`))
    }
  }
  const { loc } = dir
  if (dir.exp) dirArgs.push(dir.exp)
  if (dir.arg) {
    if (!dir.exp) {
      dirArgs.push(`void 0`)
    }
    dirArgs.push(dir.arg)
  }
  if (Object.keys(dir.modifiers).length) {
    if (!dir.arg) {
      if (!dir.exp) {
        dirArgs.push(`void 0`)
      }
      dirArgs.push(`void 0`)
    }
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
