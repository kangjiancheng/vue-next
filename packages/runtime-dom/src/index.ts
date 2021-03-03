import {
  createRenderer,
  createHydrationRenderer,
  warn,
  RootRenderFunction,
  CreateAppFunction,
  Renderer,
  HydrationRenderer,
  App,
  RootHydrateFunction,
  isRuntimeOnly
} from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp, forcePatchProp } from './patchProp'
// Importing from the compiler, will be tree-shaken in prod
import { isFunction, isString, isHTMLTag, isSVGTag, extend } from '@vue/shared'

declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    // Note: if updating this, also update `types/refBail.d.ts`.
    runtimeDOMBailTypes: Node | Window
  }
}

// 初始化默认选项，准备渲染基本环境
const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps)

// lazy create the renderer - this makes core renderer logic tree-shakable
// in case the user only imports reactivity utilities from Vue.
let renderer: Renderer<Element> | HydrationRenderer

let enabledHydration = false

// 初始化 renderer 渲染器，返回 render() 与 createApp() 函数
function ensureRenderer() {
  return renderer || (renderer = createRenderer<Node, Element>(rendererOptions))
}

function ensureHydrationRenderer() {
  renderer = enabledHydration
    ? renderer
    : createHydrationRenderer(rendererOptions)
  enabledHydration = true
  return renderer as HydrationRenderer
}

// 抛出渲染函数
// use explicit type casts here to avoid import() calls in rolled-up d.ts
export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<Element>

export const hydrate = ((...args) => {
  ensureHydrationRenderer().hydrate(...args)
}) as RootHydrateFunction

/**
 * 开始入口
 */
export const createApp = ((...args) => {
  // ensureRenderer：初始化渲染函数render、初始化createApp 方法
  // createApp: 初始化app基本配置和方法
  const app = ensureRenderer().createApp(...args)

  // 开发库，如：vue.global.js
  if (__DEV__) {
    // 如：检测组件name属性时，不可使用这些保留name
    injectNativeTagCheck(app) // app.config.isNativeTag
    injectCustomElementCheck(app)
  }

  // 针对客户端，增强 mount 功能
  const { mount } = app
  // containerOrSelector: 挂载目标，dom节点实例 或 节点选择器
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    // 校验 挂载目标，并返回dom实例
    const container = normalizeContainer(containerOrSelector)
    if (!container) return

    // app._component 即 rootComponent，由createApp(rootComponent)传递，是根组件选项。
    const component = app._component

    // 调整 vue模版内容template 为 挂载目标dom的内容
    // 此外 vue模版内容template 可为：组件为函数、或 组件为对象有render方法、或 组件为对象有template属性
    if (!isFunction(component) && !component.render && !component.template) {
      // rootComponent 是一个对象，且不存在 render 方法、不存在 template 属性
      component.template = container.innerHTML // 挂载目标dom节点的内容
    }
    // 清空 挂载目标dom 已存在的内容
    container.innerHTML = ''

    // 执行 mount，返回组件实例上下文ctx
    const proxy = mount(container, false, container instanceof SVGElement)
    if (container instanceof Element) {
      container.removeAttribute('v-cloak') // 移除元素标签上的 v-clock 指令属性
      container.setAttribute('data-v-app', '') // 添加元素标签属性：<div id="app" data-v-app>...</div>
    }
    return proxy
  }

  return app
}) as CreateAppFunction<Element>

export const createSSRApp = ((...args) => {
  const app = ensureHydrationRenderer().createApp(...args)

  if (__DEV__) {
    injectNativeTagCheck(app)
    injectCustomElementCheck(app)
  }

  const { mount } = app
  app.mount = (containerOrSelector: Element | ShadowRoot | string): any => {
    const container = normalizeContainer(containerOrSelector)
    if (container) {
      return mount(container, true, container instanceof SVGElement)
    }
  }

  return app
}) as CreateAppFunction<Element>

// 检测是否是 原生dom元素标签
function injectNativeTagCheck(app: App) {
  // Inject `isNativeTag`
  // this is used for component name validation (dev only)
  Object.defineProperty(app.config, 'isNativeTag', {
    value: (tag: string) => isHTMLTag(tag) || isSVGTag(tag),
    writable: false
  })
}

// dev only
// 运行环境下，不可以修改 isCustomElement
function injectCustomElementCheck(app: App) {
  if (isRuntimeOnly()) {
    const value = app.config.isCustomElement
    Object.defineProperty(app.config, 'isCustomElement', {
      get() {
        return value
      },
      set() {
        warn(
          `The \`isCustomElement\` config option is only respected when using the runtime compiler.` +
            `If you are using the runtime-only build, \`isCustomElement\` must be passed to \`@vue/compiler-dom\` in the build setup instead` +
            `- for example, via the \`compilerOptions\` option in vue-loader: https://vue-loader.vuejs.org/options.html#compileroptions.`
        )
      }
    })
  }
}

// 规范 挂载目标dom容器，返回dom实例
function normalizeContainer(
  container: Element | ShadowRoot | string
): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    if (__DEV__ && !res) {
      warn(
        `Failed to mount app: mount target selector "${container}" returned null.`
      )
    }
    return res
  }
  if (
    __DEV__ &&
    container instanceof window.ShadowRoot &&
    container.mode === 'closed'
  ) {
    warn(
      `mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`
    )
  }
  return container as any
}

// SFC CSS utilities
export { useCssModule } from './helpers/useCssModule'
export { useCssVars } from './helpers/useCssVars'

// DOM-only components
export { Transition, TransitionProps } from './components/Transition'
export {
  TransitionGroup,
  TransitionGroupProps
} from './components/TransitionGroup'

// **Internal** DOM-only runtime directive helpers
export {
  vModelText,
  vModelCheckbox,
  vModelRadio,
  vModelSelect,
  vModelDynamic
} from './directives/vModel'
export { withModifiers, withKeys } from './directives/vOn'
export { vShow } from './directives/vShow'

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
