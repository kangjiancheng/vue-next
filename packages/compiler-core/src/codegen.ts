import { CodegenOptions } from './options'
import {
  RootNode,
  TemplateChildNode,
  TextNode,
  CommentNode,
  ExpressionNode,
  NodeTypes,
  JSChildNode,
  CallExpression,
  ArrayExpression,
  ObjectExpression,
  Position,
  InterpolationNode,
  CompoundExpressionNode,
  SimpleExpressionNode,
  FunctionExpression,
  ConditionalExpression,
  CacheExpression,
  locStub,
  SSRCodegenNode,
  TemplateLiteral,
  IfStatement,
  AssignmentExpression,
  ReturnStatement,
  VNodeCall,
  SequenceExpression
} from './ast'
import { SourceMapGenerator, RawSourceMap } from 'source-map'
import {
  advancePositionWithMutation,
  assert,
  isSimpleIdentifier,
  toValidAssetId
} from './utils'
import { isString, isArray, isSymbol } from '@vue/shared'
import {
  helperNameMap,
  TO_DISPLAY_STRING,
  CREATE_VNODE,
  RESOLVE_COMPONENT,
  RESOLVE_DIRECTIVE,
  SET_BLOCK_TRACKING,
  CREATE_COMMENT,
  CREATE_TEXT,
  PUSH_SCOPE_ID,
  POP_SCOPE_ID,
  WITH_SCOPE_ID,
  WITH_DIRECTIVES,
  CREATE_BLOCK,
  OPEN_BLOCK,
  CREATE_STATIC,
  WITH_CTX
} from './runtimeHelpers'
import { ImportItem } from './transform'

const PURE_ANNOTATION = `/*#__PURE__*/`

type CodegenNode = TemplateChildNode | JSChildNode | SSRCodegenNode

export interface CodegenResult {
  code: string
  preamble: string
  ast: RootNode
  map?: RawSourceMap
}

export interface CodegenContext
  extends Omit<
      Required<CodegenOptions>,
      'bindingMetadata' | 'inline' | 'isTS'
    > {
  source: string
  code: string
  line: number
  column: number
  offset: number
  indentLevel: number
  pure: boolean
  map?: SourceMapGenerator
  helper(key: symbol): string
  push(code: string, node?: CodegenNode): void
  indent(): void
  deindent(withoutNewLine?: boolean): void
  newline(): void
}

function createCodegenContext(
  ast: RootNode,
  {
    mode = 'function',
    prefixIdentifiers = mode === 'module', // false
    sourceMap = false,
    filename = `template.vue.html`,
    scopeId = null,
    optimizeImports = false,
    runtimeGlobalName = `Vue`,
    runtimeModuleName = `vue`,
    ssr = false
  }: CodegenOptions
): CodegenContext {
  const context: CodegenContext = {
    mode, // function
    prefixIdentifiers, // false
    sourceMap, // false
    filename, // template.vue.html
    scopeId, // null
    optimizeImports, // false
    runtimeGlobalName, // Vue
    runtimeModuleName, // Vue
    ssr, // false
    source: ast.loc.source, // 模版template源码
    code: ``,
    column: 1,
    line: 1,
    offset: 0,
    indentLevel: 0,
    pure: false,
    map: undefined,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code, node) {
      context.code += code
      if (!__BROWSER__ && context.map) {
        if (node) {
          let name
          if (node.type === NodeTypes.SIMPLE_EXPRESSION && !node.isStatic) {
            const content = node.content.replace(/^_ctx\./, '')
            if (content !== node.content && isSimpleIdentifier(content)) {
              name = content
            }
          }
          addMapping(node.loc.start, name)
        }
        advancePositionWithMutation(context, code)
        if (node && node.loc !== locStub) {
          addMapping(node.loc.end)
        }
      }
    },
    // 添加缩进
    indent() {
      newline(++context.indentLevel)
    },
    // 减少缩进
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }
    },
    // 添加新行并缩进
    newline() {
      newline(context.indentLevel)
    }
  }

  // 换行，并指定缩进
  function newline(n: number) {
    context.push('\n' + `  `.repeat(n))
  }

  function addMapping(loc: Position, name?: string) {
    context.map!.addMapping({
      name,
      source: context.filename,
      original: {
        line: loc.line,
        column: loc.column - 1 // source-map column is 0 based
      },
      generated: {
        line: context.line,
        column: context.column - 1
      }
    })
  }

  if (!__BROWSER__ && sourceMap) {
    // lazy require source-map implementation, only in non-browser builds
    context.map = new SourceMapGenerator()
    context.map!.setSourceContent(filename, context.source)
  }

  return context
}

export function generate(
  ast: RootNode,
  options: CodegenOptions & {
    onContextCreated?: (context: CodegenContext) => void
  } = {}
): CodegenResult {
  // 初始化codegen上下文
  const context = createCodegenContext(ast, options)
  if (options.onContextCreated) options.onContextCreated(context)

  const {
    mode, // 'function'
    push, // context.code += code
    prefixIdentifiers, // false
    indent,
    deindent,
    newline,
    scopeId, // null
    ssr
  } = context

  const hasHelpers = ast.helpers.length > 0
  const useWithBlock = !prefixIdentifiers && mode !== 'module' // true
  const genScopeId = !__BROWSER__ && scopeId != null && mode === 'module'
  const isSetupInlined = !__BROWSER__ && !!options.inline

  // 前置变量 设置，静态节点提升

  // preambles 前置变量
  // in setup() inline mode, the preamble is generated in a sub context
  // and returned separately.
  const preambleContext = isSetupInlined
    ? createCodegenContext(ast, options)
    : context
  if (!__BROWSER__ && mode === 'module') {
    // TODO: cfs - analyze
    genModulePreamble(ast, preambleContext, genScopeId, isSetupInlined)
  } else {
    // 针对存在静态提升节点，如：<div><i :class="red">1</i>abc</div>
    // 解析其中静态提升文本节点abc，结果为：context.code +=
    // 'const _Vue = Vue'
    // 'const { createTextVNode: _createTextVNode } = _Vue'
    // ''
    // 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")'
    // ''
    // 'return '
    genFunctionPreamble(ast, preambleContext)
  }

  // 开始生成渲染函数代码

  // enter render function
  const functionName = ssr ? `ssrRender` : `render` // render
  const args = ssr ? ['_ctx', '_push', '_parent', '_attrs'] : ['_ctx', '_cache']
  // TODO: cfs - analyze
  if (!__BROWSER__ && options.bindingMetadata && !options.inline) {
    // binding optimization args
    args.push('$props', '$setup', '$data', '$options')
  }
  // TODO: cfs - analyze
  const signature =
    !__BROWSER__ && options.isTS
      ? args.map(arg => `${arg}: any`).join(',')
      : args.join(', ') // '_ctx, _cache'

  if (genScopeId) {
    // TODO: cfs - analyze
    if (isSetupInlined) {
      push(`${PURE_ANNOTATION}_withId(`)
    } else {
      push(`const ${functionName} = ${PURE_ANNOTATION}_withId(`)
    }
  }

  if (isSetupInlined || genScopeId) {
    // TODO: cfs - analyze
    push(`(${signature}) => {`)
  } else {
    // 'function render(_ctx, _cache) {'
    push(`function ${functionName}(${signature}) {`)
  }
  indent() // 换行并缩进

  if (useWithBlock) {
    push(`with (_ctx) {`)
    indent()
    // function mode const declarations should be inside with block
    // also they should be renamed to avoid collision with user properties
    if (hasHelpers) {
      // 'const { createVNode: _createVNode, createTextVNode: _createTextVNode } = _Vue\n\n'
      push(
        `const { ${ast.helpers
          .map(s => `${helperNameMap[s]}: _${helperNameMap[s]}`)
          .join(', ')} } = _Vue`
      )
      push(`\n`)
      newline() // 添加新行并缩进
    }

    // 针对存在静态提升节点，如：<div><i :class="red">1</i>abc</div>
    // 解析结果为：
    // 'const _Vue = Vue'
    // 'const { createTextVNode: _createTextVNode } = _Vue'
    // ''
    // 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")'
    // ''
    // 'return function render(_ctx, _cache) {'
    // '  with (_ctx) {'
    // '    const { createVNode: _createVNode, createTextVNode: _createTextVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue\n\n'
  }

  // 解析自定义组件

  // generate asset resolution statements
  if (ast.components.length) {
    // 自定义组件列表，在transformElement中初始化
    // 如 template: '<div><hello-world></hello-world><good-bye></good-bye></div>'
    // code:
    // 'const _component_hello__world = _resolveComponent("hello-world")'
    // 'const _component_good_bye = _resolveComponent("good-bye")'
    genAssets(ast.components, 'component', context)

    // 换行
    if (ast.directives.length || ast.temps > 0) {
      newline() // 添加新行并缩进
    }
  }

  // 解析自定义指令

  if (ast.directives.length) {
    // 自定义指令，如 '<div v-click-out-layer></div>
    // 'const _directive_click_out_layer = _resolveDirective("click-out-layer")'
    genAssets(ast.directives, 'directive', context)
    if (ast.temps > 0) {
      newline() // 添加新行并缩进
    }
  }
  // 临时变量
  if (ast.temps > 0) {
    // code: 'let _temp1, _temp2, _temp3...'
    push(`let `)
    for (let i = 0; i < ast.temps; i++) {
      push(`${i > 0 ? `, ` : ``}_temp${i}`)
    }
  }
  if (ast.components.length || ast.directives.length || ast.temps) {
    push(`\n`) // 不用缩进
    newline() // 添加新行并缩进
  }

  // generate the VNode tree expression
  if (!ssr) {
    push(`return `)
    // 解析结束
    // 'const _Vue = Vue'
    // ... // 静态节点提升
    // 'return function render(_ctx, _cache) {'
    // '  with (_ctx) {'
    // '    // 节点生成函数
    // '    const { createVNode: _createVNode, createTextVNode: _createTextVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue'
    // ''
    // '    const _component_hello__world = _resolveComponent("hello-world")'
    // '    const _directive_click_out_layer = _resolveDirective("click-out-layer")'
    // '    let _temp1, _temp2, _temp3...'
    // ''
    // '    return '
  }
  if (ast.codegenNode) {
    // ast树的codegenNode: 由transform最后阶段的createRootCodegen
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  if (useWithBlock) {
    deindent()
    push(`}`)
  }

  deindent()
  push(`}`)

  if (genScopeId) {
    push(`)`)
  }

  return {
    ast,
    code: context.code,
    preamble: isSetupInlined ? preambleContext.code : ``,
    // SourceMapGenerator does have toJSON() method but it's not in the types
    map: context.map ? (context.map as any).toJSON() : undefined
  }
}

// 生成codegen前置变量，主要针对静态节点的提升
function genFunctionPreamble(ast: RootNode, context: CodegenContext) {
  const {
    ssr, // false
    prefixIdentifiers, // false
    push, // function (code) { context.code += code }
    newline, // function
    runtimeModuleName, // 'Vue'
    runtimeGlobalName // 'Vue'
  } = context
  const VueBinding =
    !__BROWSER__ && ssr
      ? `require(${JSON.stringify(runtimeModuleName)})` // TODO: cfs - !BROWSER
      : runtimeGlobalName // 'Vue'

  // 转换ast helpers的名字，e.g: CREATE_TEXT 对应的 Symbol('createTextVNode') 转换为 'createTextVNode: _createTextVNode'
  const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

  // Generate const declaration for helpers
  // In prefix mode, we place the const declaration at top so it's done
  // only once; But if we not prefixing, we place the declaration inside the
  // with block so it doesn't incur the `in` check cost for every helper access.
  if (ast.helpers.length > 0) {
    if (!__BROWSER__ && prefixIdentifiers) {
      // TODO: cfs - !__BROWSER__
      push(
        `const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}\n`
      )
    } else {
      // "with" mode.

      // save Vue in a separate variable to avoid collision
      // context.code = 'const _Vue = Vue\n'
      push(`const _Vue = ${VueBinding}\n`) // context.code += code

      // in "with" mode, helpers are declared inside the with block to avoid
      // has check cost, but hoists are lifted out of the function - we need
      // to provide the helper here.
      if (ast.hoists.length) {
        // 存在 ast 静态提升节点列表
        // 先执行静态节点生成 变量函数
        // e.g:
        // template:
        //    <div class="btn-click" @click="handleClick">
        //      <i class="loading"></i> 点击 {{ count }}
        //      <div :class="hello">
        //        <div>123 {{ count }}</div>
        //        abc
        //      </div>
        //    </div>
        // 此时提升静态节点：标签i节点 '<i class="loading"></i>' 和 文本节点 'abc'
        //
        // ast helpers: runtimeHelpers.ts
        //    [CREATE_VNODE, CTO_DISPLAY_STRING, CREATE_TEXT, OPEN_BLOCK, CREATE_BLOCK]
        //
        // 即: [Symbol('createVNode'), Symbol('toDisplayString'), Symbol('createTextVNode'), Symbol('openBlock'), Symbol('createBlock')]

        const staticHelpers = [
          CREATE_VNODE,
          CREATE_COMMENT,
          CREATE_TEXT,
          CREATE_STATIC
        ]
          .filter(helper => ast.helpers.includes(helper))
          .map(aliasHelper)
          .join(', ') // 如：'createVNode: _createVNode, createTextVNode: _createTextVNode'

        // ast code:
        // 'const _Vue = Vue\n' +
        // 'const { createVNode: _createVNode, createTextVNode: _createTextVNode } = _Vue\n'
        push(`const { ${staticHelpers} } = _Vue\n`)
      }
    }
  }

  // TODO: analyze cfs - !__BROWSER__
  // generate variables for ssr helpers
  if (!__BROWSER__ && ast.ssrHelpers && ast.ssrHelpers.length) {
    // ssr guarantees prefixIdentifier: true
    push(
      `const { ${ast.ssrHelpers
        .map(aliasHelper)
        .join(', ')} } = require("@vue/server-renderer")\n`
    )
  }

  genHoists(ast.hoists, context)
  newline()
  push(`return `)

  // 针对存在静态提升节点，如：<div><i :class="red">1</i>abc</div>
  // 解析结果为：
  // 'const _Vue = Vue'
  // 'const { createTextVNode: _createTextVNode } = _Vue'
  // ''
  // 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")'
  // ''
  // 'return '
}

function genModulePreamble(
  ast: RootNode,
  context: CodegenContext,
  genScopeId: boolean,
  inline?: boolean
) {
  const {
    push,
    helper,
    newline,
    scopeId,
    optimizeImports,
    runtimeModuleName
  } = context

  if (genScopeId) {
    ast.helpers.push(WITH_SCOPE_ID)
    if (ast.hoists.length) {
      ast.helpers.push(PUSH_SCOPE_ID, POP_SCOPE_ID)
    }
  }

  // generate import statements for helpers
  if (ast.helpers.length) {
    if (optimizeImports) {
      // when bundled with webpack with code-split, calling an import binding
      // as a function leads to it being wrapped with `Object(a.b)` or `(0,a.b)`,
      // incurring both payload size increase and potential perf overhead.
      // therefore we assign the imports to variables (which is a constant ~50b
      // cost per-component instead of scaling with template size)
      push(
        `import { ${ast.helpers
          .map(s => helperNameMap[s])
          .join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`
      )
      push(
        `\n// Binding optimization for webpack code-split\nconst ${ast.helpers
          .map(s => `_${helperNameMap[s]} = ${helperNameMap[s]}`)
          .join(', ')}\n`
      )
    } else {
      push(
        `import { ${ast.helpers
          .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
          .join(', ')} } from ${JSON.stringify(runtimeModuleName)}\n`
      )
    }
  }

  if (ast.ssrHelpers && ast.ssrHelpers.length) {
    push(
      `import { ${ast.ssrHelpers
        .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
        .join(', ')} } from "@vue/server-renderer"\n`
    )
  }

  if (ast.imports.length) {
    genImports(ast.imports, context)
    newline()
  }

  if (genScopeId) {
    push(
      `const _withId = ${PURE_ANNOTATION}${helper(WITH_SCOPE_ID)}("${scopeId}")`
    )
    newline()
  }

  genHoists(ast.hoists, context)
  newline()

  if (!inline) {
    push(`export `)
  }
}

// 生成指自定义组件与自定义指令的code
function genAssets(
  assets: string[], // 自定义组件标签名
  type: 'component' | 'directive',
  { helper, push, newline }: CodegenContext
) {
  const resolver = helper(
    type === 'component' ? RESOLVE_COMPONENT : RESOLVE_DIRECTIVE
  )
  for (let i = 0; i < assets.length; i++) {
    const id = assets[i]
    push(
      // 如 template: '<hello-world></hello-world>'
      // code: 'const _component_hello__world = _resolveComponent("hello-world")'
      `const ${toValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)})`
    )
    // 换行
    if (i < assets.length - 1) {
      newline()
    }
  }
}

// 静态提升节点 codegenNode
// 如：<div><i :class="red">1</i>abc</div>
// 解析其中静态提升文本节点abc: 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")\n'
function genHoists(hoists: (JSChildNode | null)[], context: CodegenContext) {
  if (!hoists.length) {
    return
  }
  // e.g:
  // template:
  //    <div class="btn-click" @click="handleClick">
  //      <i class="loading"></i> 点击 {{ count }}
  //      <div :class="hello">
  //        <div>123 {{ count }}</div>
  //        abc
  //      </div>
  //    </div>
  // 此时提升静态节点：标签i节点 '<i class="loading"></i>' 和 文本节点 'abc'

  context.pure = true
  const { push, newline, helper, scopeId, mode } = context
  // TODO: analyze cfs - !__BROWSER__
  const genScopeId = !__BROWSER__ && scopeId != null && mode !== 'function'
  newline() // 换行 context.code + '\n'

  // TODO: analyze cfs - !__BROWSER__
  // push scope Id before initializing hoisted vnodes so that these vnodes
  // get the proper scopeId as well.
  if (genScopeId) {
    push(`${helper(PUSH_SCOPE_ID)}("${scopeId}")`)
    newline()
  }

  // 如：<div><i :class="red">1</i>abc</div>
  // 解析其中静态提升文本节点abc: 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")\n'
  hoists.forEach((exp, i) => {
    if (exp) {
      // exp 为节点的codegenNode，注意此codegenNode为静态提升前的codegenNode，不是静态提升后的ast节点的codegenNode
      push(`const _hoisted_${i + 1} = `) // 'const _hoisted_1 = '
      genNode(exp, context) // '/*#__PURE__*/_createTextVNode("abc")'
      newline()
    }
  })

  // TODO: analyze cfs - !__BROWSER__
  if (genScopeId) {
    push(`${helper(POP_SCOPE_ID)}()`)
    newline()
  }
  context.pure = false
}

function genImports(importsOptions: ImportItem[], context: CodegenContext) {
  if (!importsOptions.length) {
    return
  }
  importsOptions.forEach(imports => {
    context.push(`import `)
    genNode(imports.exp, context)
    context.push(` from '${imports.path}'`)
    context.newline()
  })
}

function isText(n: string | CodegenNode) {
  return (
    isString(n) ||
    n.type === NodeTypes.SIMPLE_EXPRESSION ||
    n.type === NodeTypes.TEXT ||
    n.type === NodeTypes.INTERPOLATION ||
    n.type === NodeTypes.COMPOUND_EXPRESSION
  )
}

function genNodeListAsArray(
  nodes: (string | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext
) {
  const multilines =
    nodes.length > 3 ||
    ((!__BROWSER__ || __DEV__) && nodes.some(n => isArray(n) || !isText(n)))
  context.push(`[`)
  multilines && context.indent()
  genNodeList(nodes, context, multilines)
  multilines && context.deindent()
  context.push(`]`)
}

function genNodeList(
  nodes: (string | symbol | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext,
  multilines: boolean = false,
  comma: boolean = true
) {
  const { push, newline } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      genNodeListAsArray(node, context)
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(',')
        newline()
      } else {
        comma && push(', ')
      }
    }
  }
}

// 生成ast节点对应的code代码
function genNode(node: CodegenNode | symbol | string, context: CodegenContext) {
  if (isString(node)) {
    context.push(node)
    return
  }
  if (isSymbol(node)) {
    context.push(context.helper(node))
    return
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      __DEV__ &&
        assert(
          node.codegenNode != null,
          `Codegen node is missing for element/if/for node. ` +
            `Apply appropriate transforms first.`
        )
      genNode(node.codegenNode!, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.TEXT_CALL:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.COMMENT:
      genComment(node, context)
      break
    case NodeTypes.VNODE_CALL:
      // 如，静态提升dom标签节点，'<span class="abc">123</span>'
      genVNodeCall(node, context)
      break

    case NodeTypes.JS_CALL_EXPRESSION:
      // 如：静态提升文本节点: 'abc'，节点类型在
      genCallExpression(node, context)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context)
      break
    case NodeTypes.JS_ARRAY_EXPRESSION:
      genArrayExpression(node, context)
      break
    case NodeTypes.JS_FUNCTION_EXPRESSION:
      genFunctionExpression(node, context)
      break
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
    case NodeTypes.JS_CACHE_EXPRESSION:
      genCacheExpression(node, context)
      break

    // SSR only types
    case NodeTypes.JS_BLOCK_STATEMENT:
      !__BROWSER__ && genNodeList(node.body, context, true, false)
      break
    case NodeTypes.JS_TEMPLATE_LITERAL:
      !__BROWSER__ && genTemplateLiteral(node, context)
      break
    case NodeTypes.JS_IF_STATEMENT:
      !__BROWSER__ && genIfStatement(node, context)
      break
    case NodeTypes.JS_ASSIGNMENT_EXPRESSION:
      !__BROWSER__ && genAssignmentExpression(node, context)
      break
    case NodeTypes.JS_SEQUENCE_EXPRESSION:
      !__BROWSER__ && genSequenceExpression(node, context)
      break
    case NodeTypes.JS_RETURN_STATEMENT:
      !__BROWSER__ && genReturnStatement(node, context)
      break

    /* istanbul ignore next */
    case NodeTypes.IF_BRANCH:
      // noop
      break
    default:
      if (__DEV__) {
        assert(false, `unhandled codegen node type: ${(node as any).type}`)
        // make sure we exhaust all possible types
        const exhaustiveCheck: never = node
        return exhaustiveCheck
      }
  }
}

function genText(
  node: TextNode | SimpleExpressionNode,
  context: CodegenContext
) {
  context.push(JSON.stringify(node.content), node)
}

function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
  const { content, isStatic } = node
  context.push(isStatic ? JSON.stringify(content) : content, node)
}

function genInterpolation(node: InterpolationNode, context: CodegenContext) {
  const { push, helper, pure } = context
  if (pure) push(PURE_ANNOTATION)
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genCompoundExpression(
  node: CompoundExpressionNode,
  context: CodegenContext
) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genExpressionAsPropertyKey(
  node: ExpressionNode,
  context: CodegenContext
) {
  const { push } = context
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    push(`[`)
    genCompoundExpression(node, context)
    push(`]`)
  } else if (node.isStatic) {
    // only quote keys if necessary
    const text = isSimpleIdentifier(node.content)
      ? node.content
      : JSON.stringify(node.content)
    push(text, node)
  } else {
    push(`[${node.content}]`, node)
  }
}

function genComment(node: CommentNode, context: CodegenContext) {
  if (__DEV__) {
    const { push, helper, pure } = context
    if (pure) {
      push(PURE_ANNOTATION)
    }
    push(`${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`, node)
  }
}

// 生成标签元素节点的code
function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { push, helper, pure } = context
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking
  } = node
  if (directives) {
    push(helper(WITH_DIRECTIVES) + `(`)
  }
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `)
  }
  if (pure) {
    push(PURE_ANNOTATION)
  }
  push(helper(isBlock ? CREATE_BLOCK : CREATE_VNODE) + `(`, node)
  genNodeList(
    genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
    context
  )
  push(`)`)
  if (isBlock) {
    push(`)`)
  }
  if (directives) {
    push(`, `)
    genNode(directives, context)
    push(`)`)
  }
}

function genNullableArgs(args: any[]): CallExpression['arguments'] {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  return args.slice(0, i + 1).map(arg => arg || `null`)
}

// JavaScript
// 静态dom标签节点
// 如生成静态提升节点对应的code代码，template: <div><i :class="red">1</i>abc</div>，其中的静态文本节点 'abc'，得到 '/*#__PURE__*/_createTextVNode(["abc"])'
function genCallExpression(node: CallExpression, context: CodegenContext) {
  const { push, helper, pure } = context
  // 如提升静态文本节点，template: <div><i :class="red">1</i>abc</div>
  // 此时解析静态提升节点：'abc'
  // 则 node.callee为 CREATE_TEXT = Symbol('createTextVNode')
  const callee = isString(node.callee) ? node.callee : helper(node.callee)
  if (pure) {
    // 静态提升
    // context.code += `/*#__PURE__*/`
    push(PURE_ANNOTATION)
  }
  push(callee + `(`, node)
  // 转换参数个数，如静态节点 'abc'
  // context.code += 'abc'
  genNodeList(node.arguments, context)
  push(`)`)

  // 最终
  // context.code += '/*#__PURE__*/_createTextVNode("abc")'
}

function genObjectExpression(node: ObjectExpression, context: CodegenContext) {
  const { push, indent, deindent, newline } = context
  const { properties } = node
  if (!properties.length) {
    push(`{}`, node)
    return
  }
  const multilines =
    properties.length > 1 ||
    ((!__BROWSER__ || __DEV__) &&
      properties.some(p => p.value.type !== NodeTypes.SIMPLE_EXPRESSION))
  push(multilines ? `{` : `{ `)
  multilines && indent()
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i]
    // key
    genExpressionAsPropertyKey(key, context)
    push(`: `)
    // value
    genNode(value, context)
    if (i < properties.length - 1) {
      // will only reach this if it's multilines
      push(`,`)
      newline()
    }
  }
  multilines && deindent()
  push(multilines ? `}` : ` }`)
}

function genArrayExpression(node: ArrayExpression, context: CodegenContext) {
  genNodeListAsArray(node.elements, context)
}

function genFunctionExpression(
  node: FunctionExpression,
  context: CodegenContext
) {
  const { push, indent, deindent, scopeId, mode } = context
  const { params, returns, body, newline, isSlot } = node
  // slot functions also need to push scopeId before rendering its content
  const genScopeId =
    !__BROWSER__ && isSlot && scopeId != null && mode !== 'function'

  if (genScopeId) {
    push(`_withId(`)
  } else if (isSlot) {
    push(`_${helperNameMap[WITH_CTX]}(`)
  }
  push(`(`, node)
  if (isArray(params)) {
    genNodeList(params, context)
  } else if (params) {
    genNode(params, context)
  }
  push(`) => `)
  if (newline || body) {
    push(`{`)
    indent()
  }
  if (returns) {
    if (newline) {
      push(`return `)
    }
    if (isArray(returns)) {
      genNodeListAsArray(returns, context)
    } else {
      genNode(returns, context)
    }
  } else if (body) {
    genNode(body, context)
  }
  if (newline || body) {
    deindent()
    push(`}`)
  }
  if (genScopeId || isSlot) {
    push(`)`)
  }
}

function genConditionalExpression(
  node: ConditionalExpression,
  context: CodegenContext
) {
  const { test, consequent, alternate, newline: needNewline } = node
  const { push, indent, deindent, newline } = context
  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    const needsParens = !isSimpleIdentifier(test.content)
    needsParens && push(`(`)
    genExpression(test, context)
    needsParens && push(`)`)
  } else {
    push(`(`)
    genNode(test, context)
    push(`)`)
  }
  needNewline && indent()
  context.indentLevel++
  needNewline || push(` `)
  push(`? `)
  genNode(consequent, context)
  context.indentLevel--
  needNewline && newline()
  needNewline || push(` `)
  push(`: `)
  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
  if (!isNested) {
    context.indentLevel++
  }
  genNode(alternate, context)
  if (!isNested) {
    context.indentLevel--
  }
  needNewline && deindent(true /* without newline */)
}

function genCacheExpression(node: CacheExpression, context: CodegenContext) {
  const { push, helper, indent, deindent, newline } = context
  push(`_cache[${node.index}] || (`)
  if (node.isVNode) {
    indent()
    push(`${helper(SET_BLOCK_TRACKING)}(-1),`)
    newline()
  }
  push(`_cache[${node.index}] = `)
  genNode(node.value, context)
  if (node.isVNode) {
    push(`,`)
    newline()
    push(`${helper(SET_BLOCK_TRACKING)}(1),`)
    newline()
    push(`_cache[${node.index}]`)
    deindent()
  }
  push(`)`)
}

function genTemplateLiteral(node: TemplateLiteral, context: CodegenContext) {
  const { push, indent, deindent } = context
  push('`')
  const l = node.elements.length
  const multilines = l > 3
  for (let i = 0; i < l; i++) {
    const e = node.elements[i]
    if (isString(e)) {
      push(e.replace(/(`|\$|\\)/g, '\\$1'))
    } else {
      push('${')
      if (multilines) indent()
      genNode(e, context)
      if (multilines) deindent()
      push('}')
    }
  }
  push('`')
}

function genIfStatement(node: IfStatement, context: CodegenContext) {
  const { push, indent, deindent } = context
  const { test, consequent, alternate } = node
  push(`if (`)
  genNode(test, context)
  push(`) {`)
  indent()
  genNode(consequent, context)
  deindent()
  push(`}`)
  if (alternate) {
    push(` else `)
    if (alternate.type === NodeTypes.JS_IF_STATEMENT) {
      genIfStatement(alternate, context)
    } else {
      push(`{`)
      indent()
      genNode(alternate, context)
      deindent()
      push(`}`)
    }
  }
}

function genAssignmentExpression(
  node: AssignmentExpression,
  context: CodegenContext
) {
  genNode(node.left, context)
  context.push(` = `)
  genNode(node.right, context)
}

function genSequenceExpression(
  node: SequenceExpression,
  context: CodegenContext
) {
  context.push(`(`)
  genNodeList(node.expressions, context)
  context.push(`)`)
}

function genReturnStatement(
  { returns }: ReturnStatement,
  context: CodegenContext
) {
  context.push(`return `)
  if (isArray(returns)) {
    genNodeListAsArray(returns, context)
  } else {
    genNode(returns, context)
  }
}
