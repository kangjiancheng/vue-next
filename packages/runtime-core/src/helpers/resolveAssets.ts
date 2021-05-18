import {
  currentInstance,
  ConcreteComponent,
  ComponentOptions,
  getComponentName
} from '../component'
import { currentRenderingInstance } from '../componentRenderContext'
import { Directive } from '../directives'
import { camelize, capitalize, isString } from '@vue/shared'
import { warn } from '../warning'
import { VNodeTypes } from '../vnode'

export const COMPONENTS = 'components'
export const DIRECTIVES = 'directives'
export const FILTERS = 'filters'

export type AssetTypes = typeof COMPONENTS | typeof DIRECTIVES | typeof FILTERS

/**
 * @private
 * 解析组件vnode，如：<HelloWorld></HelloWorld>
 *  const _component_hello_world = _resolveComponent("hello-world")
 * _createVNode(_component_hello_world)
 */
export function resolveComponent(
  name: string,
  maybeSelfReference?: boolean
): ConcreteComponent | string {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name
}

export const NULL_DYNAMIC_COMPONENT = Symbol()

/**
 * @private
 * 解析动态组件vnode
 */
export function resolveDynamicComponent(component: unknown): VNodeTypes {
  if (isString(component)) {
    // <component is="HelloWorld"></component>
    // vnode: (_openBlock(), _createBlock(_resolveDynamicComponent("HelloWorld")))
    return resolveAsset(COMPONENTS, component, false) || component
  } else {
    // invalid types will fallthrough to createVNode and raise warning
    //
    // <component :is="HelloWorld" />
    // vnode: (_openBlock(), _createBlock(_resolveDynamicComponent(HelloWorld)))
    return (component || NULL_DYNAMIC_COMPONENT) as any
  }
}

/**
 * @private
 */
export function resolveDirective(name: string): Directive | undefined {
  return resolveAsset(DIRECTIVES, name)
}

/**
 * v2 compat only
 * @internal
 */
export function resolveFilter(name: string): Function | undefined {
  return resolveAsset(FILTERS, name)
}

/**
 * @private
 * overload 1: components
 */
function resolveAsset(
  type: typeof COMPONENTS, // 组件
  name: string,
  warnMissing?: boolean,
  maybeSelfReference?: boolean
): ConcreteComponent | undefined
// overload 2: directives
function resolveAsset(
  type: typeof DIRECTIVES, // 指令
  name: string
): Directive | undefined
// implementation
// overload 3: filters (compat only)
function resolveAsset(type: typeof FILTERS, name: string): Function | undefined
// implementation
function resolveAsset(
  type: AssetTypes, // 'components'/'directives'/'FILTERS' - 组件对象的选项属性名
  name: string,
  warnMissing = true,
  maybeSelfReference = false
) {
  // 当前渲染的组件实例
  const instance = currentRenderingInstance || currentInstance
  if (instance) {
    // 组件对象或组件标签名
    const Component = instance.type

    // explicit self name has highest priority
    if (type === COMPONENTS) {
      // 获取组件名
      const selfName = getComponentName(Component)
      if (
        selfName &&
        (selfName === name ||
          selfName === camelize(name) ||
          selfName === capitalize(camelize(name)))
      ) {
        return Component
      }
    }

    // 返回解析到组件/指令对象
    const res =
      // local registration
      // check instance[type] first for components with mixin or extends.
      resolve(instance[type] || (Component as ComponentOptions)[type], name) || // 当前组件的组件定义列表components
      // global registration
      resolve(instance.appContext[type], name) // 全局组件的组件定义列表components

    if (!res && maybeSelfReference) {
      // fallback to implicit self-reference
      return Component
    }

    if (__DEV__ && warnMissing && !res) {
      warn(`Failed to resolve ${type.slice(0, -1)}: ${name}`)
    }

    return res
  } else if (__DEV__) {
    warn(
      `resolve${capitalize(type.slice(0, -1))} ` +
        `can only be used in render() or setup().`
    )
  }
}

function resolve(registry: Record<string, any> | undefined, name: string) {
  return (
    registry &&
    (registry[name] ||
      registry[camelize(name)] ||
      registry[capitalize(camelize(name))])
  )
}
