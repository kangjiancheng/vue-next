import {
  ConcreteComponent,
  getCurrentInstance,
  SetupContext,
  ComponentInternalInstance,
  LifecycleHooks,
  currentInstance,
  getComponentName,
  ComponentOptions
} from '../component'
import {
  VNode,
  cloneVNode,
  isVNode,
  VNodeProps,
  invokeVNodeHook
} from '../vnode'
import { warn } from '../warning'
import {
  onBeforeUnmount,
  injectHook,
  onUnmounted,
  onMounted,
  onUpdated
} from '../apiLifecycle'
import {
  isString,
  isArray,
  isRegExp,
  ShapeFlags,
  remove,
  invokeArrayFns
} from '@vue/shared'
import { watch } from '../apiWatch'
import {
  RendererInternals,
  queuePostRenderEffect,
  MoveType,
  RendererElement,
  RendererNode
} from '../renderer'
import { setTransitionHooks } from './BaseTransition'
import { ComponentRenderContext } from '../componentPublicInstance'
import { devtoolsComponentAdded } from '../devtools'
import { isAsyncWrapper } from '../apiAsyncComponent'
import { isSuspense } from './Suspense'

type MatchPattern = string | RegExp | (string | RegExp)[]

export interface KeepAliveProps {
  include?: MatchPattern
  exclude?: MatchPattern
  max?: number | string
}

type CacheKey = string | number | symbol | ConcreteComponent
type Cache = Map<CacheKey, VNode>
type Keys = Set<CacheKey>

export interface KeepAliveContext extends ComponentRenderContext {
  renderer: RendererInternals
  activate: (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    isSVG: boolean,
    optimized: boolean
  ) => void
  deactivate: (vnode: VNode) => void
}

export const isKeepAlive = (vnode: VNode): boolean =>
  (vnode.type as any).__isKeepAlive

/*
 * 1、在执行渲染函数时，根据key或组件对象 返回已缓存的vnode；
 * 2、在子组件切换时，执行 deactivated - 存储要被卸载的组件el dom、 activated - insert要显示的子组件并patch
 * 3、在执行mounted/updated中 缓存当前子组件的vnode；
 */
const KeepAliveImpl: ComponentOptions = {
  name: `KeepAlive`,

  // Marker for special handling inside the renderer. We are not using a ===
  // check directly on KeepAlive in the renderer, because importing it directly
  // would prevent it from being tree-shaken.
  __isKeepAlive: true,

  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },

  setup(props: KeepAliveProps, { slots }: SetupContext) {
    const instance = getCurrentInstance()!
    // KeepAlive communicates with the instantiated renderer via the
    // ctx where the renderer passes in its internals,
    // and the KeepAlive instance exposes activate/deactivate implementations.
    // The whole point of this is to avoid importing KeepAlive directly in the
    // renderer to facilitate tree-shaking.
    const sharedContext = instance.ctx as KeepAliveContext

    // if the internal renderer is not registered, it indicates that this is server-side rendering,
    // for KeepAlive, we just need to render its children
    if (__SSR__ && !sharedContext.renderer) {
      return () => {
        const children = slots.default && slots.default()
        return children && children.length === 1 ? children[0] : children
      }
    }

    const cache: Cache = new Map() // 已缓存的子组件vnode列表
    const keys: Keys = new Set() // 已缓存的子组件key列表
    let current: VNode | null = null // 当前缓存的子组件

    if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
      ;(instance as any).__v_cache = cache
    }

    const parentSuspense = instance.suspense

    const {
      renderer: {
        p: patch,
        m: move,
        um: _unmount,
        o: { createElement }
      }
    } = sharedContext
    // 存储被缓存的组件vnode的el即真实dom
    const storageContainer = createElement('div')

    // 子组件切换时，触发激活函数 - vnode 为要被激活的子组件vnode - 为之前缓存的子组件vnode，在渲染函数中生成返回的
    sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
      const instance = vnode.component!
      // 将缓存的子组件的el挂载到当前父dom下
      move(vnode, container, anchor, MoveType.ENTER, parentSuspense)
      // 恢复缓存后的子组件，还要比较是否有prop发生变化
      // in case props have changed
      patch(
        instance.vnode,
        vnode,
        container,
        anchor,
        instance,
        parentSuspense,
        isSVG,
        vnode.slotScopeIds,
        optimized
      )
      queuePostRenderEffect(() => {
        // 将子组件标记为激活状态
        instance.isDeactivated = false
        if (instance.a) {
          invokeArrayFns(instance.a)
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeMounted
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance.parent, vnode)
        }
      }, parentSuspense)

      if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
        // Update components tree
        devtoolsComponentAdded(instance)
      }
    }

    // 切换子组件时，缓存当前要被销毁的子组件
    sharedContext.deactivate = (vnode: VNode) => {
      // 要被销毁/缓存的子组件vnode
      const instance = vnode.component!
      // 将当前子组件挂载到缓存dom上
      move(vnode, storageContainer, null, MoveType.LEAVE, parentSuspense)
      // 在本轮更新后，执行该副作用回调
      queuePostRenderEffect(() => {
        if (instance.da) {
          invokeArrayFns(instance.da)
        }
        const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted
        if (vnodeHook) {
          invokeVNodeHook(vnodeHook, instance.parent, vnode)
        }
        // 手动将当前已缓缓存的子组件标记为非激跃状态
        instance.isDeactivated = true
      }, parentSuspense)

      if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
        // Update components tree
        devtoolsComponentAdded(instance)
      }
    }

    function unmount(vnode: VNode) {
      // reset the shapeFlag so it can be properly unmounted
      resetShapeFlag(vnode)
      _unmount(vnode, instance, parentSuspense, true)
    }

    function pruneCache(filter?: (name: string) => boolean) {
      cache.forEach((vnode, key) => {
        const name = getComponentName(vnode.type as ConcreteComponent)
        if (name && (!filter || !filter(name))) {
          pruneCacheEntry(key)
        }
      })
    }

    function pruneCacheEntry(key: CacheKey) {
      const cached = cache.get(key) as VNode
      if (!current || cached.type !== current.type) {
        unmount(cached)
      } else if (current) {
        // current active instance should no longer be kept-alive.
        // we can't unmount it now but it might be later, so reset its flag now.
        resetShapeFlag(current)
      }
      cache.delete(key)
      keys.delete(key)
    }

    // prune cache on include/exclude prop change
    watch(
      () => [props.include, props.exclude],
      ([include, exclude]) => {
        include && pruneCache(name => matches(include, name))
        exclude && pruneCache(name => !matches(exclude, name))
      },
      // prune post-render after `current` has been updated
      { flush: 'post', deep: true }
    )

    // cache sub tree after render
    let pendingCacheKey: CacheKey | null = null
    const cacheSubtree = () => {
      // fix #1621, the pendingCacheKey could be 0
      if (pendingCacheKey != null) {
        cache.set(pendingCacheKey, getInnerChild(instance.subTree))
      }
    }
    onMounted(cacheSubtree) // keep-alive setup的渲染函数执行完后，执行mounted 回调函数 缓存当前子组件vnode
    onUpdated(cacheSubtree)

    onBeforeUnmount(() => {
      cache.forEach(cached => {
        const { subTree, suspense } = instance
        const vnode = getInnerChild(subTree)
        if (cached.type === vnode.type) {
          // current instance will be unmounted as part of keep-alive's unmount
          resetShapeFlag(vnode)
          // but invoke its deactivated hook here
          const da = vnode.component!.da
          da && queuePostRenderEffect(da, suspense)
          return
        }
        unmount(cached)
      })
    })

    // 执行完setup函数后，返回渲染函数，之后挂载时 再执行渲染函数，返回当前子组件的vnode
    return () => {
      pendingCacheKey = null

      if (!slots.default) {
        return null
      }

      const children = slots.default()
      const rawVNode = children[0]
      if (children.length > 1) {
        if (__DEV__) {
          warn(`KeepAlive should contain exactly one component child.`)
        }
        current = null
        return children
      } else if (
        !isVNode(rawVNode) ||
        (!(rawVNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) &&
          !(rawVNode.shapeFlag & ShapeFlags.SUSPENSE))
      ) {
        current = null
        return rawVNode
      }

      // keep-alive 子组件vnode
      let vnode = getInnerChild(rawVNode)
      const comp = vnode.type as ConcreteComponent

      // for async components, name check should be based in its loaded
      // inner component if available
      const name = getComponentName(
        isAsyncWrapper(vnode)
          ? (vnode.type as ComponentOptions).__asyncResolved || {}
          : comp
      )

      const { include, exclude, max } = props

      // 不在include里的，直接返回新生成的子组件vnode
      if (
        (include && (!name || !matches(include, name))) ||
        (exclude && name && matches(exclude, name))
      ) {
        // 不被缓存的组件，直接返回新的vnode
        current = vnode
        return rawVNode
      }

      const key = vnode.key == null ? comp : vnode.key
      const cachedVNode = cache.get(key) // keep-alive组件更新时，即切换到其它子组件时，获取其缓存的vnode

      // clone vnode if it's reused because we are going to mutate it
      if (vnode.el) {
        vnode = cloneVNode(vnode)
        if (rawVNode.shapeFlag & ShapeFlags.SUSPENSE) {
          rawVNode.ssContent = vnode
        }
      }
      // #1513 it's possible for the returned vnode to be cloned due to attr
      // fallthrough or scopeId, so the vnode here may not be the final vnode
      // that is mounted. Instead of caching it directly, we store the pending
      // key and cache `instance.subTree` (the normalized vnode) in
      // beforeMount/beforeUpdate hooks.
      pendingCacheKey = key

      // 如果此子组件已被缓存到keep-alive组件上的话：复制其中缓存的数据
      if (cachedVNode) {
        // copy over mounted state
        vnode.el = cachedVNode.el
        vnode.component = cachedVNode.component
        if (vnode.transition) {
          // recursively update transition hooks on subTree
          setTransitionHooks(vnode, vnode.transition!)
        }
        // avoid vnode being mounted as fresh
        // 避免重新渲染缓存的子组件时，重新生成vnode，此时应该执行shareContext里的 activate 组件生命周期，来恢复缓存的子组件数据
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
        // make this key the freshest
        keys.delete(key)
        keys.add(key)
      } else {
        keys.add(key)
        // prune oldest entry
        if (max && keys.size > parseInt(max as string, 10)) {
          pruneCacheEntry(keys.values().next().value)
        }
      }
      // avoid vnode being unmounted
      // 标记为keep_alive缓存组件类型，避免切换到其它子组件时，触发常规卸载unmounted生命周期，此时应该执行上面的组件deactivated生命周期函数
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

      current = vnode
      return isSuspense(rawVNode.type) ? rawVNode : vnode // 返回子组件vnode
    }
  }
}

if (__COMPAT__) {
  KeepAliveImpl.__isBuildIn = true
}

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
export const KeepAlive = KeepAliveImpl as any as {
  __isKeepAlive: true
  new (): {
    $props: VNodeProps & KeepAliveProps
  }
}

function matches(pattern: MatchPattern, name: string): boolean {
  if (isArray(pattern)) {
    return pattern.some((p: string | RegExp) => matches(p, name))
  } else if (isString(pattern)) {
    return pattern.split(',').includes(name)
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

export function onActivated(
  hook: Function,
  target?: ComponentInternalInstance | null
) {
  registerKeepAliveHook(hook, LifecycleHooks.ACTIVATED, target)
}

export function onDeactivated(
  hook: Function,
  target?: ComponentInternalInstance | null
) {
  registerKeepAliveHook(hook, LifecycleHooks.DEACTIVATED, target)
}

function registerKeepAliveHook(
  hook: Function & { __wdc?: Function },
  type: LifecycleHooks,
  target: ComponentInternalInstance | null = currentInstance
) {
  // cache the deactivate branch check wrapper for injected hooks so the same
  // hook can be properly deduped by the scheduler. "__wdc" stands for "with
  // deactivation check".
  const wrappedHook =
    hook.__wdc ||
    (hook.__wdc = () => {
      // only fire the hook if the target instance is NOT in a deactivated branch.
      let current: ComponentInternalInstance | null = target
      while (current) {
        if (current.isDeactivated) {
          return
        }
        current = current.parent
      }
      return hook()
    })
  injectHook(type, wrappedHook, target)
  // In addition to registering it on the target instance, we walk up the parent
  // chain and register it on all ancestor instances that are keep-alive roots.
  // This avoids the need to walk the entire component tree when invoking these
  // hooks, and more importantly, avoids the need to track child components in
  // arrays.
  if (target) {
    let current = target.parent
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current)
      }
      current = current.parent
    }
  }
}

function injectToKeepAliveRoot(
  hook: Function & { __weh?: Function },
  type: LifecycleHooks,
  target: ComponentInternalInstance,
  keepAliveRoot: ComponentInternalInstance
) {
  // injectHook wraps the original for error handling, so make sure to remove
  // the wrapped version.
  const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */)
  onUnmounted(() => {
    remove(keepAliveRoot[type]!, injected)
  }, target)
}

function resetShapeFlag(vnode: VNode) {
  // bitwise operations to remove keep alive flags
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
}

function getInnerChild(vnode: VNode) {
  return vnode.shapeFlag & ShapeFlags.SUSPENSE ? vnode.ssContent! : vnode
}
