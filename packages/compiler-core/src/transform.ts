import { TransformOptions } from './options'
import {
  RootNode,
  NodeTypes,
  ParentNode,
  TemplateChildNode,
  ElementNode,
  DirectiveNode,
  Property,
  ExpressionNode,
  createSimpleExpression,
  JSChildNode,
  SimpleExpressionNode,
  ElementTypes,
  CacheExpression,
  createCacheExpression,
  TemplateLiteral,
  createVNodeCall,
  ConstantTypes
} from './ast'
import {
  isString,
  isArray,
  NOOP,
  PatchFlags,
  PatchFlagNames,
  EMPTY_OBJ,
  capitalize,
  camelize
} from '@vue/shared'
import { defaultOnError } from './errors'
import {
  TO_DISPLAY_STRING,
  FRAGMENT,
  helperNameMap,
  CREATE_BLOCK,
  CREATE_COMMENT,
  OPEN_BLOCK
} from './runtimeHelpers'
import { isVSlot } from './utils'
import { hoistStatic, isSingleElementRoot } from './transforms/hoistStatic'

// There are two types of transforms:
//
// - NodeTransform:
//   Transforms that operate directly on a ChildNode. NodeTransforms may mutate,
//   replace or remove the node being processed.
export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | (() => void) | (() => void)[]

// - DirectiveTransform:
//   Transforms that handles a single directive attribute on an element.
//   It translates the raw directive into actual props for the VNode.
export type DirectiveTransform = (
  dir: DirectiveNode,
  node: ElementNode,
  context: TransformContext,
  // a platform specific compiler can import the base transform and augment
  // it by passing in this optional argument.
  augmentor?: (ret: DirectiveTransformResult) => DirectiveTransformResult
) => DirectiveTransformResult

export interface DirectiveTransformResult {
  props: Property[]
  needRuntime?: boolean | symbol
  ssrTagParts?: TemplateLiteral['elements']
}

// A structural directive transform is a technically a NodeTransform;
// Only v-if and v-for fall into this category.
export type StructuralDirectiveTransform = (
  node: ElementNode,
  dir: DirectiveNode,
  context: TransformContext
) => void | (() => void)

export interface ImportItem {
  exp: string | ExpressionNode
  path: string
}

export interface TransformContext
  extends Required<Omit<TransformOptions, 'filename'>> {
  selfName: string | null
  root: RootNode
  helpers: Set<symbol>
  components: Set<string>
  directives: Set<string>
  hoists: (JSChildNode | null)[]
  imports: Set<ImportItem>
  temps: number
  cached: number
  identifiers: { [name: string]: number | undefined }
  scopes: {
    vFor: number
    vSlot: number
    vPre: number
    vOnce: number
  }
  parent: ParentNode | null
  childIndex: number
  currentNode: RootNode | TemplateChildNode | null
  helper<T extends symbol>(name: T): T
  helperString(name: symbol): string
  replaceNode(node: TemplateChildNode): void
  removeNode(node?: TemplateChildNode): void
  onNodeRemoved(): void
  addIdentifiers(exp: ExpressionNode | string): void
  removeIdentifiers(exp: ExpressionNode | string): void
  hoist(exp: JSChildNode): SimpleExpressionNode
  cache<T extends JSChildNode>(exp: T, isVNode?: boolean): CacheExpression | T
  constantCache: Map<TemplateChildNode, ConstantTypes>
}

export function createTransformContext(
  root: RootNode,
  {
    filename = '',
    prefixIdentifiers = false,
    hoistStatic = false,
    cacheHandlers = false,
    nodeTransforms = [],
    directiveTransforms = {},
    transformHoist = null,
    isBuiltInComponent = NOOP,
    isCustomElement = NOOP,
    expressionPlugins = [],
    scopeId = null,
    ssr = false,
    ssrCssVars = ``,
    bindingMetadata = EMPTY_OBJ,
    inline = false,
    isTS = false,
    onError = defaultOnError
  }: TransformOptions
): TransformContext {
  const nameMatch = filename.replace(/\?.*$/, '').match(/([^/\\]+)\.\w+$/)
  const context: TransformContext = {
    // options
    selfName: nameMatch && capitalize(camelize(nameMatch[1])),
    prefixIdentifiers,
    hoistStatic,
    cacheHandlers,
    nodeTransforms,
    directiveTransforms,
    transformHoist,
    isBuiltInComponent,
    isCustomElement,
    expressionPlugins,
    scopeId,
    ssr,
    ssrCssVars,
    bindingMetadata,
    inline,
    isTS, //ts 格式，编译成ts代码
    onError,

    // state
    root,
    helpers: new Set(), // 收集 在创建vnode时要用到的函数，为了在渲染阶段可以调用这些的函数去创建对应的虚拟节点，如：openBlock、createBlock、createVNode等
    components: new Set(), // 保存用户自定义的组件标签名
    directives: new Set(),
    hoists: [],
    imports: new Set(),
    constantCache: new Map(),
    temps: 0,
    cached: 0,
    identifiers: Object.create(null),
    scopes: {
      vFor: 0,
      vSlot: 0, // 上下文识别到slot指令属性，添加transform slot插件时：加1；执行完transform slot插件时：减1，以此来判断是否包含在另一个slot中
      vPre: 0,
      vOnce: 0
    },
    parent: null,
    currentNode: root,
    childIndex: 0,

    // methods
    helper(name) {
      context.helpers.add(name)
      return name
    },
    helperString(name) {
      // 获取对应的运行时函数名
      return `_${helperNameMap[context.helper(name)]}`
    },
    replaceNode(node) {
      /* istanbul ignore if */
      if (__DEV__) {
        if (!context.currentNode) {
          throw new Error(`Node being replaced is already removed.`)
        }
        if (!context.parent) {
          throw new Error(`Cannot replace root node.`)
        }
      }
      context.parent!.children[context.childIndex] = context.currentNode = node
    },
    removeNode(node) {
      if (__DEV__ && !context.parent) {
        throw new Error(`Cannot remove root node.`)
      }
      const list = context.parent!.children
      const removalIndex = node
        ? list.indexOf(node)
        : context.currentNode
          ? context.childIndex
          : -1
      /* istanbul ignore if */
      if (__DEV__ && removalIndex < 0) {
        throw new Error(`node being removed is not a child of current parent`)
      }
      if (!node || node === context.currentNode) {
        // current node removed
        // 移除当前节点，如v-if transform
        context.currentNode = null
        context.onNodeRemoved()
      } else {
        // 移除指定节点，如v-if transform
        // sibling node removed
        if (context.childIndex > removalIndex) {
          context.childIndex--
          context.onNodeRemoved()
        }
      }
      context.parent!.children.splice(removalIndex, 1)
    },
    onNodeRemoved: () => {},
    addIdentifiers(exp) {
      // identifier tracking only happens in non-browser builds.
      if (!__BROWSER__) {
        if (isString(exp)) {
          addId(exp)
        } else if (exp.identifiers) {
          exp.identifiers.forEach(addId)
        } else if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          addId(exp.content)
        }
      }
    },
    removeIdentifiers(exp) {
      if (!__BROWSER__) {
        if (isString(exp)) {
          removeId(exp)
        } else if (exp.identifiers) {
          exp.identifiers.forEach(removeId)
        } else if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          removeId(exp.content)
        }
      }
    },
    hoist(exp) {
      context.hoists.push(exp)
      // 重新生成节点的codegenNode
      const identifier = createSimpleExpression(
        // codegen时，对应的变量名字，如 <div><i :class="red">1</i>abc</div>，
        // 其中静态abc节点： 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")'
        `_hoisted_${context.hoists.length}`, // 指向该静态节点的vnode
        false,
        exp.loc,
        ConstantTypes.CAN_HOIST
      )
      identifier.hoisted = exp // 静态提升节点内容
      return identifier
    },
    cache(exp, isVNode = false) {
      return createCacheExpression(++context.cached, exp, isVNode)
    }
  }

  function addId(id: string) {
    const { identifiers } = context
    if (identifiers[id] === undefined) {
      identifiers[id] = 0
    }
    identifiers[id]!++
  }

  function removeId(id: string) {
    context.identifiers[id]!--
  }

  return context
}

/**
 *
 * @param root - 模版对应的 ast 语法树
 * @param options
 */
export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options)

  // 遍历解析ast上的每个节点，运用专门的nodeTransform解析插件和指令分析插件去解析所有ast节点;
  // 如：文本节点合并、删减style/script节点等，解析节点的props属性列表、解析指令、调整节点格式，生成patchFlag等，为相关节点生成相应的codegen和转换js格式节点
  traverseNode(root, context)

  // 静态提升： 元素节点、文本节点、属性节点
  // 在之后ast生成该节点的渲染片段时，可以直接用这个变量替换对应位置的渲染片段，同时生成渲染函数时，可以先执行这个静态节点，得到对应vnode，在执行渲染函数时，不必花时间去执行生成这个vnode
  // 提升静态ast节点，如 template:
  // <div class="btn-click" @click="handleClick">
  //   <i class="loading"></i> 点击 {{ count }}
  //   <div :class="hello">
  //     <div>123 {{ count }}</div>
  //     abc
  //   </div>
  // </div>
  // 提升静态节点：标签i节点 '<i class="loading"></i>' 和 文本节点 'abc'
  // 提升静态属性节点：<div class="red" style="color:blue;"></div>，即没有动态属性，会重新转换标签节点codegenNode props属性列表
  // "const _Vue = Vue
  // const { createVNode: _createVNode, createTextVNode: _createTextVNode } = _Vue
  //
  //
  // 在之后ast生成该节点的渲染片段时，可以直接用这个变量替换对应位置的渲染片段，同时生成渲染函数时，可以先执行这个静态节点，得到对应vnode，在执行渲染函数时，不必花时间去执行生成这个vnode
  // const _hoisted_1 = /*#__PURE__*/_createVNode("i", { class: "loading" }, null, -1 /* HOISTED */)
  // const _hoisted_2 = /*#__PURE__*/_createTextVNode(" abc ")
  //
  // return function render(_ctx, _cache) {
  //   with (_ctx) {
  //     const { createVNode: _createVNode, toDisplayString: _toDisplayString, createTextVNode: _createTextVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
  //
  //     return (_openBlock(), _createBlock("div", {
  //       class: "btn-click",
  //       onClick: handleClick
  //     }, [
  //       _hoisted_1,
  //       _createTextVNode(" 点击 " + _toDisplayString(count) + " ", 1 /* TEXT */),
  //       _createVNode("div", { class: hello }, [
  //         _createVNode("div", null, "123 " + _toDisplayString(count), 1 /* TEXT */),
  //         _hoisted_2
  //       ], 2 /* CLASS */)
  //     ], 8 /* PROPS */, ["onClick"]))
  //   }
  // }"
  if (options.hoistStatic) {
    // 节点静态标记 => 生成静态节点 => 提升静态节点（生成VNode） => 最终加速渲染函数执行
    hoistStatic(root, context)
  }

  // 非ssr环境下，创建ast root根节点的codegenNode
  if (!options.ssr) {
    createRootCodegen(root, context)
  }

  // 补充设置root的相关信息
  // finalize meta information
  root.helpers = [...context.helpers] // 此root的helper 列表
  root.components = [...context.components] // 保存用户自定义的组件标签名，transformElement
  root.directives = [...context.directives] // 用户自定义的指令名，transformElement
  root.imports = [...context.imports]
  root.hoists = context.hoists // 需要静态提升的 codegenNode列表
  root.temps = context.temps // 临时变量个数
  root.cached = context.cached // 缓存编译结果，如 v-once
}

// 创建ast root根节点的codegenNode
function createRootCodegen(root: RootNode, context: TransformContext) {
  const { helper } = context
  const { children } = root
  if (children.length === 1) {
    // ast根节点就一个子节点，即vue模版只有一个根元素

    const child = children[0]
    // root ast根节点就一个元素，但不是 slot元素，设置为block
    // template: '<div>...</div>'
    // if the single child is an element, turn it into a block.
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      // 只有一个根标签元素（不包括slot标签元素）
      // single element root is never hoisted so codegenNode will never be
      // SimpleExpressionNode
      const codegenNode = child.codegenNode
      if (codegenNode.type === NodeTypes.VNODE_CALL) {
        // 如 template: '<div>hello {{ "world" }} !</div>'
        codegenNode.isBlock = true
        helper(OPEN_BLOCK)
        helper(CREATE_BLOCK)
      }
      root.codegenNode = codegenNode
    } else {
      // - single <slot/>, IfNode, ForNode: already blocks. slot、if、for节点已经被转换处理为相应类型
      // - single text node: always patched.
      // root codegen falls through via genNode() 在codegen阶段通过genNode处理生成渲染代码
      root.codegenNode = child
    }
  } else if (children.length > 1) {
    // 模版存在多个根节点，转换为fragment block
    // template: '<div>...</div><div>...</div>'
    // root has multiple nodes - return a fragment block.

    let patchFlag = PatchFlags.STABLE_FRAGMENT
    let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT] // 'STABLE_FRAGMENT'

    // 模版template，根节点有多个，其中只有一个是非注释节点
    // template: '<!-- 123 --><div>...</div><!-- 123 -->'
    // check if the fragment actually contains a single valid child with
    // the rest being comments
    if (
      __DEV__ &&
      children.filter(c => c.type !== NodeTypes.COMMENT).length === 1 // 如果其它节点都是注释节点
    ) {
      // 模版 只有一个是有效的根节点，其它根节点都是注释
      patchFlag |= PatchFlags.DEV_ROOT_FRAGMENT
      patchFlagText += `, ${PatchFlagNames[PatchFlags.DEV_ROOT_FRAGMENT]}` // DEV_ROOT_FRAGMENT
    }
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT), // FRAGMENT = Symbol(__DEV__ ? `Fragment` : ``)
      undefined,
      root.children,
      patchFlag + (__DEV__ ? ` /* ${patchFlagText} */` : ``),
      undefined,
      undefined,
      true
    )
  } else {
    // no children = noop. codegen will return null.
    // 即 ast 根节点没有 codegenNode
  }
}

// 处理当前节点的子节点
export function traverseChildren(
  parent: ParentNode,
  context: TransformContext
) {
  let i = 0
  const nodeRemoved = () => {
    i--
  }
  // 如果存在子节点
  for (; i < parent.children.length; i++) {
    const child = parent.children[i]
    if (isString(child)) continue
    context.parent = parent // 当前节点的父节点
    context.childIndex = i // 子节点位置
    context.onNodeRemoved = nodeRemoved
    traverseNode(child, context) // 遍历处理子节点
  }
}

/**
 * 遍历解析每个ast语法树节点，同时运用nodeTransforms/directiveTransform中的每个插件就解析与转换节点信息格式，得到对应的codegen
 * @param node
 * @param context
 */
export function traverseNode(
  node: RootNode | TemplateChildNode, // ast 语法树的根节点，或 如 v-if的子节点列表（在解析v-if指令时，会遍历解析其子节点）
  context: TransformContext
) {
  context.currentNode = node // 当前在处理的节点
  // apply transform plugins
  /**
   *
   * nodeTransforms = [
       transformOnce,                 // 处理 v-once 指令属性节点，编译一次节点，不进行再次编译，缓存codegenNode
       transformIf,                   // 处理 v-if 指令属性节点，在添加插件时，会先插件一个新的if branch node分支流节点，将之后的else-f、else节点移进来，创建if codegenNode，并将else-if、else的codegenNode链式绑定到if分支流节点
       transformFor,                  // 处理 v-for 指令属性节点，在添加插件时，会先创建一个新的for node 类型节点，并替换当前for类型的节点，之后会处理slot场景下的v-for，和template场景下的v-for，包括对key属性的处理，并生成for节点的codegenNode
       ...(!__BROWSER__ && prefixIdentifiers
        ? [
        // order is important
          trackVForSlotScopes,        // 注意 非浏览器，如node下cfs
          transformExpression         // 注意 非浏览器
        ]
        : __BROWSER__ && __DEV__
          ? [transformExpression]     // 处理插值表达式内容，指令属性节点值表达式，排除v-for和v-on:arg属性节点，在浏览器中只需要节点验证表达式值的js语法规则：validateBrowserExpression
          : []),
       transformSlotOutlet,           // 处理slot元素组件：name属性、其它属性prop节点列表（处理方式buildProps，同transformElements）
       transformElement,              // 处理html元素节点或组件节点，解析元素节点的prop属性列表（on/bind/model/text/html/show/is）、v-slot指令与默认/具名插槽转换、patchFlag信息、用户定义的指令等，为当前节点的ast生成对应的codegen vnode执行函数节点
       trackSlotScopes,               // 处理并跟踪节点的slot指令，通过计数来识别出是否内嵌了slot指令，为transformElement检测是否定义了动态slot，创建对应的patchflag信息
       transformText,                 // 处理 连续子文本节点/表达式节点 的合并；或 如果即包含文本又包含其它类型节点时，则需要设置该子节点文本/表达式的diff patch codegenNode 信息，同时也重新定义当前节点的子节点配置
       ignoreSideEffectTags,          // 删减style/script元素节点
       ...[
        transformStyle,               // 不返回回调转换插件， html元素全部转换静态style属性为对应的动态style指令属性节点
        ...(__DEV__ ? [warnTransitionChildren] : []) // transition组件只接收一个子元素/子组件
       ],
    ]
   */
  const { nodeTransforms } = context // transform 节点所有插件列表
  const exitFns = [] // 存储 nodeTransforms 的回调函数
  // 获取当前节点所对应的插件列表
  for (let i = 0; i < nodeTransforms.length; i++) {
    // ast根节点 type: NodeTypes.ROOT，初次会运行transformText

    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      // 当前节点是否添加对应的转换插件，注意添加插件后，先执行最新添加的插件，即由后向前执行
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }
    if (!context.currentNode) {
      // 如 在运用插件调整过程中，节点可能会被删除，如style/script元素节点
      // 如 在解析if分支流节点中，会将else-if/else移动到if分支节点下，而在if transform中，会继续遍历traverseNode解析else-if/else下的子节点列表内容。
      // node was removed
      return
    } else {
      // node may have been replaced
      // 保持当前循环的节点不变，继续处理当前节点中的内容
      // 如将v-for对应的节点，重新生成一个for类型的节点，并替换当前节点，如 node type: NodeTypes.FOR
      // 如 v-if  type: NodeTypes.IF
      node = context.currentNode
    }
  }

  switch (node.type) {
    case NodeTypes.COMMENT:
      if (!context.ssr) {
        // inject import for the Comment symbol, which is needed for creating
        // comment nodes with `createVNode`
        context.helper(CREATE_COMMENT)
      }
      break
    case NodeTypes.INTERPOLATION:
      // no need to traverse, but we need to inject toString helper
      if (!context.ssr) {
        context.helper(TO_DISPLAY_STRING)
      }
      break

    // for container types, further traverse downwards
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context)
      }
      break
    case NodeTypes.IF_BRANCH:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT: // 一开始遍历跟节点
      traverseChildren(node, context) // 如果存在子节点，继续遍历
      break
  }

  // 先处理子节点的transform
  // 节点的 transforms 插件列表，依次从后往前执行，即后添加先执行
  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

/**
 * 统一格式创建指令的的transform插件，如 v-if、v-for
 * @param name 指令名
 * @param fn 指令回调
 *
 * 注意： template元素中具有v-slot时，会单独处理v-if、v-for
 */
export function createStructuralDirectiveTransform(
  name: string | RegExp, // 指令名 如 ，/^(if|else|else-if)$/、'for'
  fn: StructuralDirectiveTransform // 指令回调
): NodeTransform {
  const matches = isString(name)
    ? (n: string) => n === name // 如 v-for 的 'for'
    : (n: string) => name.test(n) // 如 v-if 的 /^(if|else|else-if)$/

  // v-if、v-for的 transform插件
  return (node, context) => {
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node
      // structural directive transforms are not concerned with slots
      // as they are handled separately in vSlot.ts
      if (node.tagType === ElementTypes.TEMPLATE && props.some(isVSlot)) {
        // 跳过v-if/v-for节点 <template v-slot></template>，在vSlot transform插件中解析
        return
      }
      const exitFns = []
      for (let i = 0; i < props.length; i++) {
        const prop = props[i]

        // 匹配v-if、 v-for （先创建v-if transform插件）
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          // structural directives are removed to avoid infinite recursion
          // also we remove them *before* applying so that it can further
          // traverse itself in case it moves the node around
          // 移除该指令节点
          props.splice(i, 1) // 已在父节点中v-if 处理子节点列表中的 v-if
          i--

          const onExit = fn(node, prop, context)
          if (onExit) exitFns.push(onExit)
        }
      }

      // 返回transform插件
      return exitFns
    }
  }
}
