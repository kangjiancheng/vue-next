import {
  ComponentInternalInstance,
  FunctionalComponent,
  Data
} from './component'
import {
  VNode,
  normalizeVNode,
  createVNode,
  Comment,
  cloneVNode,
  VNodeArrayChildren,
  isVNode,
  blockStack
} from './vnode'
import { handleError, ErrorCodes } from './errorHandling'
import { PatchFlags, ShapeFlags, isOn, isModelListener } from '@vue/shared'
import { warn } from './warning'
import { isHmrUpdating } from './hmr'
import { NormalizedProps } from './componentProps'
import { isEmitListener } from './componentEmits'
import { setCurrentRenderingInstance } from './componentRenderContext'

/**
 * dev only flag to track whether $attrs was used during render.
 * If $attrs was used during render then the warning for failed attrs
 * fallthrough can be suppressed.
 */
let accessedAttrs: boolean = false

export function markAttrsAccessed() {
  accessedAttrs = true
}

export function renderComponentRoot(
  instance: ComponentInternalInstance
): VNode {
  const {
    type: Component,
    vnode,
    proxy, // ctx proxy
    withProxy, // ctx render with proxy
    props, // 组件节点 props 属性
    propsOptions: [propsOptions], // 组件 props 选项属性
    slots,
    attrs,
    emit,
    render, // 渲染函数
    renderCache,
    data,
    setupState, // setup() 返回值
    ctx
  } = instance

  // 返回结果
  let result
  // 执行渲染生成vnode期间的组件实例
  const prev = setCurrentRenderingInstance(instance)
  if (__DEV__) {
    accessedAttrs = false
  }
  try {
    let fallthroughAttrs
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // withProxy is a proxy with a different `has` trap only for
      // runtime-compiled render functions using `with` block.
      const proxyToUse = withProxy || proxy

      // 执行组件模版对应的渲染函数，得到组件模版template的vnode
      result = normalizeVNode(
        // child.el === null ? child : cloneVNode(child)
        // 执行渲染函数
        // <div id="app">
        //   <div class="demo-base" :class="fixHeader">
        //     <button class="btn-click" @click="handleClick">点击</button>
        //   </div>
        // </div>
        // render code:
        // "const _Vue = Vue
        //
        // return function render(_ctx, _cache) {
        //   with (_ctx) {
        //     const { createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
        //
        //     return (_openBlock(), _createBlock("div", {
        //       class: ["demo-base", fixHeader]
        //     }, [
        //       _createVNode("button", {
        //         class: "btn-click",
        //         onClick: handleClick
        //       }, "点击", 8 /* PROPS */, ["onClick"])
        //     ], 2 /* CLASS */))
        //   }
        // }"
        // 返回渲染节点vnode
        render!.call(
          proxyToUse,
          proxyToUse!, // instance.ctx 的代理 proxy： RuntimeCompiledPublicInstanceProxyHandlers
          renderCache,
          props,
          setupState,
          data,
          ctx
        )
      )
      fallthroughAttrs = attrs
    } else {
      // functional
      const render = Component as FunctionalComponent
      // in dev, mark attrs accessed if optional props (attrs === props)
      if (__DEV__ && attrs === props) {
        markAttrsAccessed()
      }
      result = normalizeVNode(
        render.length > 1
          ? render(
              props,
              __DEV__
                ? {
                    get attrs() {
                      markAttrsAccessed()
                      return attrs
                    },
                    slots,
                    emit
                  }
                : { attrs, slots, emit }
            )
          : render(props, null as any /* we know it doesn't need it */)
      )
      fallthroughAttrs = Component.props
        ? attrs
        : getFunctionalFallthrough(attrs)
    }

    // attr merging
    // in dev mode, comments are preserved, and it's possible for a template
    // to have comments along side the root element which makes it a fragment
    let root = result
    let setRoot: ((root: VNode) => void) | undefined = undefined
    if (
      __DEV__ &&
      result.patchFlag > 0 &&
      result.patchFlag & PatchFlags.DEV_ROOT_FRAGMENT
    ) {
      ;[root, setRoot] = getChildRoot(result)
    }

    // Component.inheritAttrs 默认 undefined
    if (Component.inheritAttrs !== false && fallthroughAttrs) {
      const keys = Object.keys(fallthroughAttrs)
      const { shapeFlag } = root
      if (keys.length) {
        if (
          shapeFlag & ShapeFlags.ELEMENT ||
          shapeFlag & ShapeFlags.COMPONENT
        ) {
          // vnode节点上有形如："onUpdate:xxx"的属性props，即attrs属性列表里 是否存在 'onUpdate:' 开头的属性
          // 如 <hello-world v-model="helloMsg"></hello-world>
          if (propsOptions && keys.some(isModelListener)) {
            // If a v-model listener (onUpdate:xxx) has a corresponding declared
            // prop, it indicates this component expects to handle v-model and
            // it should not fallthrough.
            // related: #1543, #1643, #1989
            fallthroughAttrs = filterModelListeners(
              // 过滤掉onUpdate:modelValue即 v-model属性事件
              fallthroughAttrs,
              propsOptions
            )
          }

          // 传递attrs属性render root vnode的props
          root = cloneVNode(root, fallthroughAttrs)
        } else if (__DEV__ && !accessedAttrs && root.type !== Comment) {
          const allAttrs = Object.keys(attrs)
          const eventAttrs: string[] = []
          const extraAttrs: string[] = []
          for (let i = 0, l = allAttrs.length; i < l; i++) {
            const key = allAttrs[i]
            if (isOn(key)) {
              // ignore v-model handlers when they fail to fallthrough
              if (!isModelListener(key)) {
                // remove `on`, lowercase first letter to reflect event casing
                // accurately
                eventAttrs.push(key[2].toLowerCase() + key.slice(3))
              }
            } else {
              extraAttrs.push(key)
            }
          }
          if (extraAttrs.length) {
            warn(
              `Extraneous non-props attributes (` +
                `${extraAttrs.join(', ')}) ` +
                `were passed to component but could not be automatically inherited ` +
                `because component renders fragment or text root nodes.`
            )
          }
          if (eventAttrs.length) {
            warn(
              `Extraneous non-emits event listeners (` +
                `${eventAttrs.join(', ')}) ` +
                `were passed to component but could not be automatically inherited ` +
                `because component renders fragment or text root nodes. ` +
                `If the listener is intended to be a component custom event listener only, ` +
                `declare it using the "emits" option.`
            )
          }
        }
      }
    }

    // inherit directives
    if (vnode.dirs) {
      if (__DEV__ && !isElementRoot(root)) {
        warn(
          `Runtime directive used on component with non-element root node. ` +
            `The directives will not function as intended.`
        )
      }
      root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs
    }
    // inherit transition data
    if (vnode.transition) {
      if (__DEV__ && !isElementRoot(root)) {
        warn(
          `Component inside <Transition> renders non-element root node ` +
            `that cannot be animated.`
        )
      }
      root.transition = vnode.transition
    }

    if (__DEV__ && setRoot) {
      setRoot(root)
    } else {
      result = root
    }
  } catch (err) {
    blockStack.length = 0
    handleError(err, instance, ErrorCodes.RENDER_FUNCTION)
    result = createVNode(Comment)
  }

  // 移除渲染生成vnode结束的组件实例
  setCurrentRenderingInstance(prev)

  // 返回渲染函数vnode
  return result
}

/**
 * dev only
 * In dev mode, template root level comments are rendered, which turns the
 * template into a fragment root, but we need to locate the single element
 * root for attrs and scope id processing.
 */
const getChildRoot = (
  vnode: VNode
): [VNode, ((root: VNode) => void) | undefined] => {
  const rawChildren = vnode.children as VNodeArrayChildren
  const dynamicChildren = vnode.dynamicChildren
  const childRoot = filterSingleRoot(rawChildren)
  if (!childRoot) {
    return [vnode, undefined]
  }
  const index = rawChildren.indexOf(childRoot)
  const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1
  const setRoot = (updatedRoot: VNode) => {
    rawChildren[index] = updatedRoot
    if (dynamicChildren) {
      if (dynamicIndex > -1) {
        dynamicChildren[dynamicIndex] = updatedRoot
      } else if (updatedRoot.patchFlag > 0) {
        vnode.dynamicChildren = [...dynamicChildren, updatedRoot]
      }
    }
  }
  return [normalizeVNode(childRoot), setRoot]
}

export function filterSingleRoot(
  children: VNodeArrayChildren
): VNode | undefined {
  let singleRoot
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (isVNode(child)) {
      // ignore user comment
      if (child.type !== Comment || child.children === 'v-if') {
        if (singleRoot) {
          // has more than 1 non-comment child, return now
          return
        } else {
          singleRoot = child
        }
      }
    } else {
      return
    }
  }
  return singleRoot
}

const getFunctionalFallthrough = (attrs: Data): Data | undefined => {
  let res: Data | undefined
  for (const key in attrs) {
    if (key === 'class' || key === 'style' || isOn(key)) {
      ;(res || (res = {}))[key] = attrs[key]
    }
  }
  return res
}

// 过滤掉onUpdate:modelValue即 v-model属性事件
const filterModelListeners = (attrs: Data, props: NormalizedProps): Data => {
  const res: Data = {}
  for (const key in attrs) {
    // 'onUpdate:xxx'
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key]
    }
  }
  return res
}

const isElementRoot = (vnode: VNode) => {
  return (
    vnode.shapeFlag & ShapeFlags.COMPONENT ||
    vnode.shapeFlag & ShapeFlags.ELEMENT ||
    vnode.type === Comment // potential v-if branch switch
  )
}

// 判断是否有必要更新组件
export function shouldUpdateComponent(
  prevVNode: VNode, // 组件渲染模版vnode
  nextVNode: VNode, // 组件渲染模版vnode
  optimized?: boolean
): boolean {
  const { props: prevProps, children: prevChildren, component } = prevVNode // 渲染模版vnode
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode
  const emits = component!.emitsOptions

  // Parent component's render function was hot-updated. Since this may have
  // caused the child component's slots content to have changed, we need to
  // force the child to update as well.
  if (__DEV__ && (prevChildren || nextChildren) && isHmrUpdating) {
    // 父组件可能导致子组件的slots内容发生变化，需要前缀更新
    return true
  }

  // force child update for runtime directive or transition on component vnode.
  if (nextVNode.dirs || nextVNode.transition) {
    // 存在指令 或 动画效果
    return true
  }

  if (optimized && patchFlag >= 0) {
    // 存在更新内容

    if (patchFlag & PatchFlags.DYNAMIC_SLOTS) {
      // 动态slot节点： v-for、v-if、动态v-slot等
      // slot content that references values that might have changed,
      // e.g. in a v-for
      return true
    }
    if (patchFlag & PatchFlags.FULL_PROPS) {
      // 存在动态指令参数 或 v-on/v-bind（无参数）指令
      if (!prevProps) {
        return !!nextProps // 如果属性都删了，就不需要更新
      }
      // presence of this flag indicates props are always non-null
      return hasPropsChanged(prevProps, nextProps!, emits) // vnode props属性列表是否发生变化：属性值变化、属性增减
    } else if (patchFlag & PatchFlags.PROPS) {
      // 静态指令属性名列表，且存在非 ref、style、class，且该指令没有被设置缓存
      // 如：v-bind、 v-model、 v-on
      const dynamicProps = nextVNode.dynamicProps! // 组件渲染模版vnode的动态属性列表

      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i]
        if (
          nextProps![key] !== prevProps![key] && // 属性值发生变化
          !isEmitListener(emits, key)
        ) {
          return true
        }
      }
    }
  } else {
    // this path is only taken by manually written render functions
    // so presence of any children leads to a forced update
    if (prevChildren || nextChildren) {
      if (!nextChildren || !(nextChildren as any).$stable) {
        return true
      }
    }
    if (prevProps === nextProps) {
      return false
    }
    if (!prevProps) {
      return !!nextProps
    }
    if (!nextProps) {
      return true
    }
    return hasPropsChanged(prevProps, nextProps, emits)
  }

  return false
}

// 判断新旧组件渲染模版vnode的动态指令props属性列表是否发生变化：
//  1、发生变化，需要更新数据
//  2、某个属性值（非emit事件）发生变化
function hasPropsChanged(
  prevProps: Data,
  nextProps: Data,
  emitsOptions: ComponentInternalInstance['emitsOptions']
): boolean {
  const nextKeys = Object.keys(nextProps)
  if (nextKeys.length !== Object.keys(prevProps).length) {
    // 组件props选项发生变化，需要更新数据
    return true
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (
      nextProps[key] !== prevProps[key] && // 组件props选项下，某个属性值（非emit事件）发生变化
      !isEmitListener(emitsOptions, key)
    ) {
      return true
    }
  }
  return false
}

export function updateHOCHostEl(
  { vnode, parent }: ComponentInternalInstance,
  el: typeof vnode.el // HostNode
) {
  while (parent && parent.subTree === vnode) {
    ;(vnode = parent.vnode).el = el
    parent = parent.parent
  }
}
