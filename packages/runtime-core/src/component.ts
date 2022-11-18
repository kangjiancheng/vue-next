import { VNode, VNodeChild, isVNode } from './vnode'
import {
  pauseTracking,
  resetTracking,
  shallowReadonly,
  proxyRefs,
  EffectScope,
  markRaw,
  track,
  TrackOpTypes,
  ReactiveEffect
} from '@vue/reactivity'
import {
  ComponentPublicInstance,
  PublicInstanceProxyHandlers,
  createDevRenderContext,
  exposePropsOnRenderContext,
  exposeSetupStateOnRenderContext,
  ComponentPublicInstanceConstructor,
  publicPropertiesMap,
  RuntimeCompiledPublicInstanceProxyHandlers
} from './componentPublicInstance'
import {
  ComponentPropsOptions,
  NormalizedPropsOptions,
  initProps,
  normalizePropsOptions
} from './componentProps'
import { Slots, initSlots, InternalSlots } from './componentSlots'
import { warn } from './warning'
import { ErrorCodes, callWithErrorHandling, handleError } from './errorHandling'
import { AppContext, createAppContext, AppConfig } from './apiCreateApp'
import { Directive, validateDirectiveName } from './directives'
import {
  applyOptions,
  ComponentOptions,
  ComputedOptions,
  MethodOptions,
  resolveMergedOptions
} from './componentOptions'
import {
  EmitsOptions,
  ObjectEmitsOptions,
  EmitFn,
  emit,
  normalizeEmitsOptions
} from './componentEmits'
import {
  EMPTY_OBJ,
  isFunction,
  NOOP,
  isObject,
  NO,
  makeMap,
  isPromise,
  ShapeFlags,
  extend
} from '@vue/shared'
import { SuspenseBoundary } from './components/Suspense'
import { CompilerOptions } from '@vue/compiler-core'
import { markAttrsAccessed } from './componentRenderUtils'
import { currentRenderingInstance } from './componentRenderContext'
import { startMeasure, endMeasure } from './profiling'
import { convertLegacyRenderFn } from './compat/renderFn'
import {
  CompatConfig,
  globalCompatConfig,
  validateCompatConfig
} from './compat/compatConfig'
import { SchedulerJob } from './scheduler'

export type Data = Record<string, unknown>

/**
 * For extending allowed non-declared props on components in TSX
 */
export interface ComponentCustomProps {}

/**
 * Default allowed non-declared props on component in TSX
 */
export interface AllowedComponentProps {
  class?: unknown
  style?: unknown
}

// Note: can't mark this whole interface internal because some public interfaces
// extend it.
export interface ComponentInternalOptions {
  /**
   * @internal
   */
  __scopeId?: string
  /**
   * @internal
   */
  __cssModules?: Data
  /**
   * @internal
   */
  __hmrId?: string
  /**
   * Compat build only, for bailing out of certain compatibility behavior
   */
  __isBuiltIn?: boolean
  /**
   * This one should be exposed so that devtools can make use of it
   */
  __file?: string
  /**
   * name inferred from filename
   */
  __name?: string
}

export interface FunctionalComponent<P = {}, E extends EmitsOptions = {}>
  extends ComponentInternalOptions {
  // use of any here is intentional so it can be a valid JSX Element constructor
  (props: P, ctx: Omit<SetupContext<E>, 'expose'>): any
  props?: ComponentPropsOptions<P>
  emits?: E | (keyof E)[]
  inheritAttrs?: boolean
  displayName?: string
  compatConfig?: CompatConfig
}

export interface ClassComponent {
  new (...args: any[]): ComponentPublicInstance<any, any, any, any, any>
  __vccOpts: ComponentOptions
}

/**
 * Concrete component type matches its actual value: it's either an options
 * object, or a function. Use this where the code expects to work with actual
 * values, e.g. checking if its a function or not. This is mostly for internal
 * implementation code.
 */
export type ConcreteComponent<
  Props = {},
  RawBindings = any,
  D = any,
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions
> =
  | ComponentOptions<Props, RawBindings, D, C, M>
  | FunctionalComponent<Props, any>

/**
 * A type used in public APIs where a component type is expected.
 * The constructor type is an artificial type returned by defineComponent().
 */
export type Component<
  Props = any,
  RawBindings = any,
  D = any,
  C extends ComputedOptions = ComputedOptions,
  M extends MethodOptions = MethodOptions
> =
  | ConcreteComponent<Props, RawBindings, D, C, M>
  | ComponentPublicInstanceConstructor<Props>

export { ComponentOptions }

type LifecycleHook<TFn = Function> = TFn[] | null

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}

// use `E extends any` to force evaluating type to fix #2362
export type SetupContext<E = EmitsOptions> = E extends any
  ? {
      attrs: Data
      slots: Slots
      emit: EmitFn<E>
      expose: (exposed?: Record<string, any>) => void
    }
  : never

/**
 * @internal
 */
export type InternalRenderFunction = {
  (
    ctx: ComponentPublicInstance,
    cache: ComponentInternalInstance['renderCache'],
    // for compiler-optimized bindings
    $props: ComponentInternalInstance['props'],
    $setup: ComponentInternalInstance['setupState'],
    $data: ComponentInternalInstance['data'],
    $options: ComponentInternalInstance['ctx']
  ): VNodeChild
  _rc?: boolean // isRuntimeCompiled

  // __COMPAT__ only
  _compatChecked?: boolean // v3 and already checked for v2 compat
  _compatWrapped?: boolean // is wrapped for v2 compat
}

/**
 * We expose a subset of properties on the internal instance as they are
 * useful for advanced external libraries and tools.
 */
export interface ComponentInternalInstance {
  uid: number
  type: ConcreteComponent
  parent: ComponentInternalInstance | null
  root: ComponentInternalInstance
  appContext: AppContext
  /**
   * Vnode representing this component in its parent's vdom tree
   */
  vnode: VNode
  /**
   * The pending new vnode from parent updates
   * @internal
   */
  next: VNode | null
  /**
   * Root vnode of this component's own vdom tree
   */
  subTree: VNode
  /**
   * Render effect instance
   */
  effect: ReactiveEffect
  /**
   * Bound effect runner to be passed to schedulers
   */
  update: SchedulerJob
  /**
   * The render function that returns vdom tree.
   * @internal
   */
  render: InternalRenderFunction | null
  /**
   * SSR render function
   * @internal
   */
  ssrRender?: Function | null
  /**
   * Object containing values this component provides for its descendents
   * @internal
   */
  provides: Data
  /**
   * Tracking reactive effects (e.g. watchers) associated with this component
   * so that they can be automatically stopped on component unmount
   * @internal
   */
  scope: EffectScope
  /**
   * cache for proxy access type to avoid hasOwnProperty calls
   * @internal
   */
  accessCache: Data | null
  /**
   * cache for render function values that rely on _ctx but won't need updates
   * after initialized (e.g. inline handlers)
   * @internal
   */
  renderCache: (Function | VNode)[]

  /**
   * Resolved component registry, only for components with mixins or extends
   * @internal
   */
  components: Record<string, ConcreteComponent> | null
  /**
   * Resolved directive registry, only for components with mixins or extends
   * @internal
   */
  directives: Record<string, Directive> | null
  /**
   * Resolved filters registry, v2 compat only
   * @internal
   */
  filters?: Record<string, Function>
  /**
   * resolved props options
   * @internal
   */
  propsOptions: NormalizedPropsOptions
  /**
   * resolved emits options
   * @internal
   */
  emitsOptions: ObjectEmitsOptions | null
  /**
   * resolved inheritAttrs options
   * @internal
   */
  inheritAttrs?: boolean
  /**
   * is custom element?
   * @internal
   */
  isCE?: boolean
  /**
   * custom element specific HMR method
   * @internal
   */
  ceReload?: (newStyles?: string[]) => void

  // the rest are only for stateful components ---------------------------------

  // main proxy that serves as the public instance (`this`)
  proxy: ComponentPublicInstance | null

  // exposed properties via expose()
  exposed: Record<string, any> | null
  exposeProxy: Record<string, any> | null

  /**
   * alternative proxy used only for runtime-compiled render functions using
   * `with` block
   * @internal
   */
  withProxy: ComponentPublicInstance | null
  /**
   * This is the target for the public instance proxy. It also holds properties
   * injected by user options (computed, methods etc.) and user-attached
   * custom properties (via `this.x = ...`)
   * @internal
   */
  ctx: Data

  // state
  data: Data
  props: Data
  attrs: Data
  slots: InternalSlots
  refs: Data
  emit: EmitFn
  /**
   * used for keeping track of .once event handlers on components
   * @internal
   */
  emitted: Record<string, boolean> | null
  /**
   * used for caching the value returned from props default factory functions to
   * avoid unnecessary watcher trigger
   * @internal
   */
  propsDefaults: Data
  /**
   * setup related
   * @internal
   */
  setupState: Data
  /**
   * devtools access to additional info
   * @internal
   */
  devtoolsRawSetupState?: any
  /**
   * @internal
   */
  setupContext: SetupContext | null

  /**
   * suspense related
   * @internal
   */
  suspense: SuspenseBoundary | null
  /**
   * suspense pending batch id
   * @internal
   */
  suspenseId: number
  /**
   * @internal
   */
  asyncDep: Promise<any> | null
  /**
   * @internal
   */
  asyncResolved: boolean

  // lifecycle
  isMounted: boolean
  isUnmounted: boolean
  isDeactivated: boolean
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_CREATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.CREATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.MOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UPDATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.UNMOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRACKED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.RENDER_TRIGGERED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.DEACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.ERROR_CAPTURED]: LifecycleHook
  /**
   * @internal
   */
  [LifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>

  /**
   * For caching bound $forceUpdate on public proxy access
   * @internal
   */
  f?: () => void
  /**
   * For caching bound $nextTick on public proxy access
   * @internal
   */
  n?: () => Promise<void>
  /**
   * `updateTeleportCssVars`
   * For updating css vars on contained teleports
   * @internal
   */
  ut?: (vars?: Record<string, string>) => void
}

const emptyAppContext = createAppContext()

let uid = 0

// 挂载前 mountComponent 时，初始化组件实例信息
export function createComponentInstance(
  vnode: VNode, // 组件初始化的vnode
  parent: ComponentInternalInstance | null, // 父组件实例
  suspense: SuspenseBoundary | null
) {
  // vnode.type 即组件
  const type = vnode.type as ConcreteComponent
  // 默认使用根组件的vnode.appContext，如果不是创建根组件，则继承父组件的app 上下文环境
  // 根组件的vnode.appContext 是在 mount()时 初始化。
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext

  const instance: ComponentInternalInstance = {
    uid: uid++, // 组件ID
    vnode, // 组件vnode
    type, // 即组件对象
    parent,
    appContext, // app 上下文
    root: null!, // to be immediately set
    next: null, // 更新组件时：组件新的渲染模版vnode
    subTree: null!, // 组件渲染模版的vnode， will be set synchronously right after creation
    effect: null!,
    update: null!, // will be set synchronously right after creation
    scope: new EffectScope(true /* detached */),
    render: null,
    proxy: null, // instance.ctx  =》PublicInstanceProxyHandlers
    exposed: null,
    exposeProxy: null,
    withProxy: null, // instance.ctx =》有vue模版编译得到的渲染函数 RuntimeCompiledPublicInstanceProxyHandlers
    provides: parent ? parent.provides : Object.create(appContext.provides),
    accessCache: null!,
    renderCache: [],

    // local resolved assets
    components: null,
    directives: null,

    // resolved props and emits options
    // 规范 组件的props属性选项格式，如转换为小驼峰、props不能已$开头、解析prop属性类型type、合并mixins里的props属性选项
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),

    // emit
    emit: null!, // to be set immediately
    emitted: null,

    // props default value
    propsDefaults: EMPTY_OBJ,

    // inheritAttrs
    inheritAttrs: type.inheritAttrs,

    // state
    ctx: EMPTY_OBJ, // 组件实例的上下文
    data: EMPTY_OBJ, // 2.x 支持
    props: EMPTY_OBJ, // 组件接收到有效props，已经进行类型、默认值处理，同时也赋值了。
    attrs: EMPTY_OBJ, // 存储 那些传给组件但组件未定义 的props属性
    slots: EMPTY_OBJ, // 组件节点 子元素slots列表
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ, // 组件 setup 返回值
    setupContext: null,

    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,

    // 生命周期函数回调事件
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null, // onBeforeMounted - 生命周期函数
    m: null, // onMounted - 生命周期函数
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  }
  if (__DEV__) {
    // 组件实例的上下文，包含：组件本身实例、组件公开的属性与方法、app全局配置
    instance.ctx = createDevRenderContext(instance)
  } else {
    instance.ctx = { _: instance }
  }
  instance.root = parent ? parent.root : instance // 绑定 root根组件的实例信息
  instance.emit = emit.bind(null, instance) // 组件实例的emit

  // apply custom element special handling
  if (vnode.ce) {
    vnode.ce(instance)
  }

  return instance
}

export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () =>
  currentInstance || currentRenderingInstance

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  currentInstance = instance
  instance.scope.on()
}

export const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off()
  currentInstance = null
}

const isBuiltInTag = /*#__PURE__*/ makeMap('slot,component')

// 校验 组件name属性
export function validateComponentName(name: string, config: AppConfig) {
  const appIsNativeTag = config.isNativeTag || NO
  if (isBuiltInTag(name) || appIsNativeTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component id: ' + name
    )
  }
}

export function isStatefulComponent(instance: ComponentInternalInstance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
}

export let isInSSRComponentSetup = false

/**
 * 解析组件信息，设置props、slots、setup方法返回值、组件的render方法
 */
export function setupComponent(
  instance: ComponentInternalInstance, // 组件的实例信息
  isSSR = false
) {
  isInSSRComponentSetup = isSSR

  // 组件的vnode，在 createVnode 初始化
  // 传递给组件的props，如：rootProps
  const { props, children } = instance.vnode
  // 组件式：4
  const isStateful = isStatefulComponent(instance)

  // 初始化组件实例的props，即得到最终真正有效的props、attrs 并进行props的类型检查、默认值处理等
  initProps(instance, props, isStateful, isSSR)

  // 初始化组件实例的slots列表
  initSlots(instance, children)

  // setup 方法的返回值
  const setupResult = isStateful
    ? setupStatefulComponent(instance, isSSR)
    : undefined
  isInSSRComponentSetup = false
  return setupResult
}

// 设置组件setup数据，并设置组件的render方法
function setupStatefulComponent(
  instance: ComponentInternalInstance, // 组件实例信息
  isSSR: boolean
) {
  // 组件对象
  const Component = instance.type as ComponentOptions

  // 组件对象的属性名校验
  if (__DEV__) {
    // 组件名  -  不可使用保留的关键字符串命名
    if (Component.name) {
      validateComponentName(Component.name, instance.appContext.config)
    }
    // 子组件名  -  不可使用保留的关键字符串命名
    if (Component.components) {
      const names = Object.keys(Component.components)
      for (let i = 0; i < names.length; i++) {
        validateComponentName(names[i], instance.appContext.config)
      }
    }
    // 自定义指令名  -  不能与官方内置指令一样：v-if、v-show...
    if (Component.directives) {
      const names = Object.keys(Component.directives)
      for (let i = 0; i < names.length; i++) {
        validateDirectiveName(names[i])
      }
    }
    if (Component.compilerOptions && isRuntimeOnly()) {
      warn(
        `"compilerOptions" is only supported when using a build of Vue that ` +
          `includes the runtime compiler. Since you are using a runtime-only ` +
          `build, the options should be passed via your build tool config instead.`
      )
    }
  }

  // 0. create render proxy property access cache
  // 缓存 相关属性归属 的范围  -  props、data、setup、组件上下文context
  instance.accessCache = Object.create(null) // 属性的所属范围
  // 1. create public instance / render proxy
  // also mark it raw so it's never observed
  // 拦截 instance.ctx 的访问get、设置set、判断has
  // get: data、setupState、props、全局属性、组件实例公开属性与方法 等等
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers))

  // 将组件的props选项列表添加到组件实例上下文ctx
  if (__DEV__) {
    // 绑定 组件props选项列表，并返回实际有效的props属性（已规范并赋值）
    exposePropsOnRenderContext(instance)
  }

  // 组件的 setup 方法
  // 2. call setup()
  const { setup } = Component
  if (setup) {
    // 设置setup方法的上下文
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)

    setCurrentInstance(instance) // 当前正在挂载的组件实例
    // 在执行setup期间，停止对setup 内部数据变化的跟踪与收集
    pauseTracking()

    // 执行组件的setup方法，并返回结果： setupResult
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION, // 标志 报错时的范围
      // 传递给 setup(props, setupContext) 方法的参数列表：最终的instance.props、组件上下文
      [__DEV__ ? shallowReadonly(instance.props) : instance.props, setupContext] // setup(props, context) 接收的参数
    )

    // 恢复跟踪
    resetTracking()
    unsetCurrentInstance()

    // 客户端未实现 Promise
    if (isPromise(setupResult)) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance)
      if (isSSR) {
        // return the promise so server-renderer can wait on it
        return setupResult
          .then((resolvedResult: unknown) => {
            handleSetupResult(instance, resolvedResult, isSSR)
          })
          .catch(e => {
            handleError(e, instance, ErrorCodes.SETUP_FUNCTION)
          })
      } else if (__FEATURE_SUSPENSE__) {
        // async setup returned Promise.
        // bail here and wait for re-entry.
        instance.asyncDep = setupResult
        if (__DEV__ && !instance.suspense) {
          const name = Component.name ?? 'Anonymous'
          warn(
            `Component <${name}>: setup function returned a promise, but no ` +
              `<Suspense> boundary was found in the parent component tree. ` +
              `A component with async setup() must be nested in a <Suspense> ` +
              `in order to be rendered.`
          )
        }
      } else if (__DEV__) {
        warn(
          `setup() returned a Promise, but the version of Vue you are using ` +
            `does not support it yet.`
        )
      }
    } else {
      // 设置setup方法的返回到组件实例上，并设置组件render方法
      handleSetupResult(instance, setupResult, isSSR)
    }
  } else {
    // 设置组件render方法
    finishComponentSetup(instance, isSSR)
  }
}

// 校验组件的setup方法的执行结果：返回值， 如果存在，则应该是对象 或 函数(转换为render)
export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown, // setup() 返回值
  isSSR: boolean
) {
  if (isFunction(setupResult)) {
    // setup 可以返回一个渲染函数
    // setup returned an inline render function
    if (__SSR__ && (instance.type as ComponentOptions).__ssrInlineRender) {
      // when the function's name is `ssrRender` (compiled by SFC inline mode),
      // set it as ssrRender instead.
      instance.ssrRender = setupResult
    } else {
      // 如 keep-live 组件返回的就是一个函数
      instance.render = setupResult as InternalRenderFunction
    }
  } else if (isObject(setupResult)) {
    // setup 返回一个对象
    if (__DEV__ && isVNode(setupResult)) {
      // 不可以直接返回一个vnode，应该返回一个render函数
      warn(
        `setup() should not return VNodes directly - return a render function instead.`
      )
    }

    // setup returned bindings.
    // assuming a render function compiled from template is present.
    // 假设存在一个从模板编译的渲染函数
    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      instance.devtoolsRawSetupState = setupResult
    }

    // 拦截 - 对setupResult进行响应式数据读取与访问
    // 如 读取时：对于响应式数据ref则 返回value值，对于原始数据即非响应式数据则 直接读取并返回
    instance.setupState = proxyRefs(setupResult)

    // 绑定 setupState
    if (__DEV__) {
      // 暴露 setup的返回值到 组件实例上下文ctx，同时限制属性名开头 '_' 、 '$'
      exposeSetupStateOnRenderContext(instance)
    }
  } else if (__DEV__ && setupResult !== undefined) {
    warn(
      `setup() should return an object. Received: ${
        setupResult === null ? 'null' : typeof setupResult
      }`
    )
  }
  finishComponentSetup(instance, isSSR)
}

type CompileFunction = (
  template: string | object,
  options?: CompilerOptions
) => InternalRenderFunction

// Vue 模版源码的编译器，生成渲染函数render
let compile: CompileFunction | undefined
let installWithProxy: (i: ComponentInternalInstance) => void

/**
 * For runtime-dom to register the compiler.
 * Note the exported method uses any to avoid d.ts relying on the compiler types.
 */
// 在 packages/vue/src/index.ts 时，调用执行赋值
export function registerRuntimeCompiler(_compile: any) {
  compile = _compile
  installWithProxy = i => {
    if (i.render!._rc) {
      i.withProxy = new Proxy(i.ctx, RuntimeCompiledPublicInstanceProxyHandlers)
    }
  }
}

// 设置组件的 render方法
// dev only
export const isRuntimeOnly = () => !compile

export function finishComponentSetup(
  instance: ComponentInternalInstance,
  isSSR: boolean,
  skipOptions?: boolean
) {
  const Component = instance.type as ComponentOptions // vnode.type，组件

  if (__COMPAT__) {
    convertLegacyRenderFn(instance)

    if (__DEV__ && Component.compatConfig) {
      validateCompatConfig(Component.compatConfig)
    }
  }

  // template / render function normalization
  // could be already set when returned from setup()
  if (!instance.render) {
    // setup不存在； 或如果setup存在，且 setup 返回一个对象
    // 如果setup 返回的是一个 函数，则赋值为render，否则render不存在
    // 不存在render函数时，但组件存在模版代码时，需要进行编译从而得到render
    // only do on-the-fly compile if not in SSR - SSR on-the-fly compliation
    // is done by server-renderer
    if (!isSSR && compile && !Component.render) {
      const template =
        (__COMPAT__ &&
          instance.vnode.props &&
          instance.vnode.props['inline-template']) ||
        Component.template ||
        resolveMergedOptions(instance).template
      if (template) {
        if (__DEV__) {
          startMeasure(instance, `compile`)
        }
        const { isCustomElement, compilerOptions } = instance.appContext.config
        const { delimiters, compilerOptions: componentCompilerOptions } =
          Component
        const finalCompilerOptions: CompilerOptions = extend(
          extend(
            {
              isCustomElement, // 用户自定义元素的方法
              delimiters // 用户自定义的插值模版，如： ['{{', '}}']
            },
            compilerOptions
          ),
          componentCompilerOptions
        )
        if (__COMPAT__) {
          // pass runtime compat config into the compiler
          finalCompilerOptions.compatConfig = Object.create(globalCompatConfig)
          if (Component.compatConfig) {
            // @ts-expect-error types are not compatible
            extend(finalCompilerOptions.compatConfig, Component.compatConfig)
          }
        }
        // 编译vue源码模版template 得到 render函数
        Component.render = compile(template, finalCompilerOptions)
        if (__DEV__) {
          endMeasure(instance, `compile`)
        }
      }
    }

    instance.render = (Component.render || NOOP) as InternalRenderFunction

    // for runtime-compiled render functions using `with` blocks, the render
    // proxy used needs a different `has` handler which is more performant and
    // also only allows a whitelist of globals to fallthrough.
    // render的上下文ctx: 通过编译vue模版得到的渲染函数，渲染函数带有with作用域，需要引入has、get拦截方法
    if (installWithProxy) {
      installWithProxy(instance)
    }
  }

  // 针对 vue 2.x 版本的支持
  // 如设置 组件的 data 属性
  // support for 2.x options
  // rollup: isBundlerESMBuild ? `__VUE_OPTIONS_API__` : true
  if (__FEATURE_OPTIONS_API__ && !(__COMPAT__ && skipOptions)) {
    setCurrentInstance(instance)
    pauseTracking()
    applyOptions(instance)
    resetTracking()
    unsetCurrentInstance()
  }

  // warn missing template/render
  // the runtime compilation of template in SSR is done by server-render
  if (__DEV__ && !Component.render && instance.render === NOOP && !isSSR) {
    /* istanbul ignore if */
    if (!compile && Component.template) {
      // 当compile不存在，但存在template时，提示需要带有编译器版本的vue
      warn(
        `Component provided template option but ` +
          `runtime compilation is not supported in this build of Vue.` +
          (__ESM_BUNDLER__
            ? ` Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js".`
            : __ESM_BROWSER__
            ? ` Use "vue.esm-browser.js" instead.`
            : __GLOBAL__
            ? ` Use "vue.global.js" instead.`
            : ``) /* should not happen */
      )
    } else {
      warn(`Component is missing template or render function.`)
    }
  }
}

function createAttrsProxy(instance: ComponentInternalInstance): Data {
  return new Proxy(
    instance.attrs,
    __DEV__
      ? {
          get(target, key: string) {
            markAttrsAccessed()
            track(instance, TrackOpTypes.GET, '$attrs')
            return target[key]
          },
          set() {
            warn(`setupContext.attrs is readonly.`)
            return false
          },
          deleteProperty() {
            warn(`setupContext.attrs is readonly.`)
            return false
          }
        }
      : {
          get(target, key: string) {
            track(instance, TrackOpTypes.GET, '$attrs')
            return target[key]
          }
        }
  )
}

// 设置组件的setup方法的上下文
export function createSetupContext(
  instance: ComponentInternalInstance
): SetupContext {
  const expose: SetupContext['expose'] = exposed => {
    if (__DEV__ && instance.exposed) {
      warn(`expose() should be called only once per setup().`)
    }
    instance.exposed = exposed || {}
  }

  let attrs: Data
  if (__DEV__) {
    // We use getters in dev in case libs like test-utils overwrite instance
    // properties (overwrites should not be done in prod)
    return Object.freeze({
      get attrs() {
        return attrs || (attrs = createAttrsProxy(instance))
      },
      get slots() {
        return shallowReadonly(instance.slots)
      },
      get emit() {
        return (event: string, ...args: any[]) => instance.emit(event, ...args)
      },
      expose
    })
  } else {
    return {
      get attrs() {
        return attrs || (attrs = createAttrsProxy(instance))
      },
      slots: instance.slots,
      emit: instance.emit,
      expose
    }
  }
}

export function getExposeProxy(instance: ComponentInternalInstance) {
  if (instance.exposed) {
    return (
      instance.exposeProxy ||
      (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
        get(target, key: string) {
          if (key in target) {
            return target[key]
          } else if (key in publicPropertiesMap) {
            return publicPropertiesMap[key](instance)
          }
        },
        has(target, key: string) {
          return key in target || key in publicPropertiesMap
        }
      }))
    )
  }
}

const classifyRE = /(?:^|[-_])(\w)/g
const classify = (str: string): string =>
  str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '')

// 获取组件名
export function getComponentName(
  Component: ConcreteComponent,
  includeInferred = true
): string | false | undefined {
  return isFunction(Component)
    ? Component.displayName || Component.name
    : Component.name || (includeInferred && Component.__name)
}

/* istanbul ignore next */
export function formatComponentName(
  instance: ComponentInternalInstance | null,
  Component: ConcreteComponent,
  isRoot = false
): string {
  let name = getComponentName(Component)
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/)
    if (match) {
      name = match[1]
    }
  }

  if (!name && instance && instance.parent) {
    // try to infer the name based on reverse resolution
    const inferFromRegistry = (registry: Record<string, any> | undefined) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key
        }
      }
    }
    name =
      inferFromRegistry(
        instance.components ||
          (instance.parent.type as ComponentOptions).components
      ) || inferFromRegistry(instance.appContext.components)
  }

  return name ? classify(name) : isRoot ? `App` : `Anonymous`
}

export function isClassComponent(value: unknown): value is ClassComponent {
  return isFunction(value) && '__vccOpts' in value
}
