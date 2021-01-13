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

// 注意注意！最好别在源码注释中添加字符串：/*#__PURE__*/
// 否则！可能会导致源码不能正常调试，浏览器无法执行该注释之后的代码，无法进行断点设置
const PURE_ANNOTATION = `/*#__PURE__*/` // treeShake 代码优化

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

// 如 标签节点template，且只有文本节点: <div style="color: blue;" class="green" :class="red" @click="handleClick">hello {{ someone }} !</div>
// code =
// 'const _Vue = Vue
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { toDisplayString: _toDisplayString, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return (_openBlock(), _createBlock("div", {
//       style: {"color":"blue"},
//       class: red,                    // 注意：合并属性，如 class="blue" :class="red" 转换为 ["blue", red]
//       onClick: handleClick
//     }, "hello " + _toDisplayString(someone) + " !", 11 /* TEXT, CLASS, PROPS */, ["onClick"]))  // 如果只有文本节点，即使都是静态的，则不需要提升
//   }
// }'
// 如果有自定义指令，则 'return _withDirectives((_openBlock(), _createBlock(...)), 自定义指令属性节点code... )'

/****** 静态提升、多个子元素、合并属性 ***********/
// 如 template: '<div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} ! <i>123</i></div>'
// 则 code =
// "const _Vue = Vue
// const { createVNode: _createVNode, createTextVNode: _createTextVNode } = _Vue
//
// const _hoisted_1 = /*#__PURE__*/_createVNode("i", null, "123", -1 /* HOISTED */)
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { toDisplayString: _toDisplayString, createVNode: _createVNode, createTextVNode: _createTextVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return (_openBlock(), _createBlock("div", {
//       style: {"color":"blue"},
//       class: ["green", red],
//       onClick: handleClick
//     }, [
//       _createTextVNode("hello " + _toDisplayString(someone) + " ! ", 1 /* TEXT */),
//       _hoisted_1
//     ], 10 /* CLASS, PROPS */, ["onClick"]))
//   }
// }"
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

    genFunctionPreamble(ast, preambleContext)

    // 解析其中静态提升文本节点abc，结果为：context.code +=
    // 'const _Vue = Vue'
    // 'const { createTextVNode: _createTextVNode } = _Vue'
    // ''
    // 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")'
    // ''
    // 'return '
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
    // 混合文本节点，如 template: 'hello {{ who }} !'，则code += '"hello " + _toDisplayString(who) + " !'

    // 如 标签节点template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
    // 则 code += '(_openBlock(), _createBlock("div", {\n   style: "color: blue;",\n   class: "red",\n   onClick: "handleClick"}, "hello " + _toDisplayString(someone) + " !, 11 /* TEXT, CLASS, PROPS */, ["onClick"]))'
    // 如果有自定义指令， '_withDirectives((_openBlock(), _createBlock(...)), 自定义指令属性节点code... )'
    // 最终：code =
    // 'const _Vue = Vue
    //
    // return function render(_ctx, _cache) {
    //   with (_ctx) {
    //     const { toDisplayString: _toDisplayString, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
    //
    //     return (_openBlock(), _createBlock("div", {
    //       style: {"color":"blue"},
    //       class: red,
    //       onClick: handleClick
    //     }, "hello " + _toDisplayString(someone) + " !", 11 /* TEXT, CLASS, PROPS */, ["onClick"]))
    //   }
    // }'
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
    preamble: isSetupInlined ? preambleContext.code : ``, // TODO: cfs
    // SourceMapGenerator does have toJSON() method but it's not in the types
    map: context.map ? (context.map as any).toJSON() : undefined // TODO: cfs
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
// 解析其中静态提升文本节点abc，即得到了vnode节点: 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")\n'
// 在之后ast生成该节点的渲染片段时，可以直接用这个变量替换对应位置的渲染片段，同时生成渲染函数时，可以先执行这个静态节点，得到对应vnode，在执行渲染函数时，不必花时间去执行生成这个vnode
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
  hoists.forEach((exp, i) => {
    if (exp) {
      // exp 为节点的codegenNode，注意此codegenNode为静态提升前的codegenNode，不是静态提升后的ast节点的codegenNode
      push(`const _hoisted_${i + 1} = `) // 'const _hoisted_1 = '
      genNode(exp, context)
      newline()
    }
    // 解析其中静态提升文本节点abc，即得到了vnode节点: 'const _hoisted_1 = /*#__PURE__*/_createTextVNode("abc")\n'
    // 在之后ast生成该节点的渲染片段时，可以直接用这个变量替换对应位置的渲染片段，同时生成渲染函数时，可以先执行这个静态节点，得到对应vnode，在执行渲染函数时，不必花时间去执行生成这个vnode
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

// 通过数组包裹起来 '[red]'
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

// 生成 标签节点、属性节点、子节点、patchFlag、dynamicProps节点的 渲染代码片段
// 如 template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
// 则 nodes：
//    tag: '"div"',                                                     // code += '"div"'
//    props: style、class、onClick                                       // code += '{\n   style: {"color": "blue"},\n   class: red,\n   onClick: "handleClick"}'
//    children: 该children类型为 COMPOUND_EXPRESSION 'hello {{ someone }} !'  // code += '"hello " + _toDisplayString(someone) + " !'
//    patchFlag: '11 /* TEXT, CLASS, PROPS */'                          // code += '11 /* TEXT, CLASS, PROPS */'
//    dynamicProps: '["onClick"]' 动态属性                                // code += '["onClick"]'
// 其中 children：多个时，会经过 genNodeListAsArray 处理，如果children存在静态提升标记时，会直接使用对应静态提升变量
// 其中 props 类型可能为：
//    JS_OBJECT_EXPRESSION：不存在v-on/v-bind 无参数属性， 默认
//    JS_CALL_EXPRESSION： 只有v-on无参数 或 元素节点属性存在多个属性，且含有v-on/v-bind （无参数）指令属性，如 <div style="color: blue;" :class="red" v-on="{...}"></div>
//    SIMPLE_EXPRESSION：只有v-bind无参数属性值节点 或则 props 都是静态时，被静态标记，如 <div style="color: blue;" class="red">hello {{ someone }} !</div>
// 结果为 code +=
// '"div", {\n   style: {"color": "blue"},\n   class: red,\n   onClick: handleClick}, "hello " + _toDisplayString(someone) + " !, 11 /* TEXT, CLASS, PROPS */, ["onClick"]'
function genNodeList(
  nodes: (string | symbol | CodegenNode | TemplateChildNode[])[], // genVNodeCall中 [tag, props, children, patchFlag, dynamicProps]
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
      // 如果 标签有多个children, 如 <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} ! <i>123</i></div>
      // children对应的code 则为 code +=
      //          '[
      //             _createTextVNode("hello " + _toDisplayString(someone) + " ! ", 1 /* TEXT */),
      //             _hoisted_1    // 此为对应的静态提升变量
      //           ]'
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

// 生成ast节点对应的渲染代码片段（由这些源码片段构成渲染函数）
// node：ast节点的codegenNode
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
      // <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} ! <i>123</i></div>
      // 如genNodeList 解析其中子元素时，解析其 i 标签元素
      // 注意 这个i标签元素已经静态提升 node.codegenNode.content = '_hoisted_1'，则code += '_hoisted_1'
      genNode(node.codegenNode!, context)
      break
    case NodeTypes.TEXT:
      // JSON.stringify(node.content)
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      // 如ast插值节点的node.content
      // 如v-on动态指令的指令参数节点
      // 如静态属性 <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>，其中的style属性值解析
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      // 插值节点
      genInterpolation(node, context)
      break
    case NodeTypes.TEXT_CALL:
      // 不纯的文本节点，既有文本又有其它类型：template: 'hello <span>world</span>'
      genNode(node.codegenNode, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      // 如：混合文本节点，此时node即为 transformText转换后的节点：
      // {
      //    type: NodeTypes.COMPOUND_EXPRESSION, // 合成表达式节点
      //    loc: child.loc, // 第一个信息
      //    children: [child1, ` + `, ....] // 混合文本节点列表
      // }
      // e.g: template: 'hello {{ foo }} !'
      genCompoundExpression(node, context)
      break
    case NodeTypes.COMMENT:
      genComment(node, context)
      break
    case NodeTypes.VNODE_CALL:
      // 标签节点 transformElements、forNode.codegenNode、ifNode.codegenNode
      // 如 标签节点，template: '<div>123 {{ "abc" }}</div>'
      genVNodeCall(node, context)
      break

    case NodeTypes.JS_CALL_EXPRESSION:
      // 如：静态提升文本节点: 'abc'，节点类型在
      genCallExpression(node, context)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION:
      // 生成节点的属性props节点列表的渲染片段， 对象格式
      // <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
      // 则 '{\n   style: "color: blue;",\n   class: "red",\n   onClick: "handleClick"} '
      genObjectExpression(node, context)
      break
    case NodeTypes.JS_ARRAY_EXPRESSION:
      // 处理合并属性节点 <div class="blue" :class="red">hello</div>
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

// 生成文本节点的渲染代码片段
function genText(
  node: TextNode | SimpleExpressionNode,
  context: CodegenContext
) {
  context.push(JSON.stringify(node.content), node)
}

function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
  const { content, isStatic } = node
  // 如插值文本节点，isStatic = false
  context.push(isStatic ? JSON.stringify(content) : content, node)
}

// 生成文本插值的渲染代码
// 如：template = 'hello {{ who }} !'，生成其中 '{{ who }}' 节点的渲染代码片段
// 则：context.code += '_toDisplayString(who)'
function genInterpolation(node: InterpolationNode, context: CodegenContext) {
  const { push, helper, pure } = context
  if (pure) push(PURE_ANNOTATION) // `/*#__PURE__*/`
  push(`${helper(TO_DISPLAY_STRING)}(`) // '_toDisplayString('
  // 此node.content ast的 type: NodeTypes.SIMPLE_EXPRESSION
  genNode(node.content, context) // 插值文本内容（不需要字符串stringify）
  push(`)`) // ')'
}

// 生成混合文本节点的渲染代码、生成v-on动态指令的动态参数名节点的渲染代码
// 此时node即为 transformText转换后的节点：
// {
//    type: NodeTypes.COMPOUND_EXPRESSION, // 合成表达式节点
//    loc: child.loc, // 第一个信息
//    children: [child1, ` + `, ....] // 混合文本节点列表， NodeTypes.INTERPOLATION 、 NodeTypes.TEXT
// }
// e.g: template = 'hello {{ foo }} !'
// 则： context.code += '"hello " + _toDisplayString(who) + " !'
function genCompoundExpression(
  node: CompoundExpressionNode,
  context: CodegenContext
) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i]
    if (isString(child)) {
      // 如 ' + '
      context.push(child)
    } else {
      // TEXT: push(JSON.stringify(node.content))
      // INTERPOLATION: push('_toDisplayString(who)')
      // SIMPLE_EXPRESSION: 动态v-on参数名ast节点 arg
      genNode(child, context)
    }
  }
}

// 生成节点属性列表的 属性名节点 的渲染片段：混合静态属性/静态指令节点、动态v-on参数节点、动态v-bind参数节点
// 如果标签元素只有静态属性节点，则会被静态标记，不走该流程
function genExpressionAsPropertyKey(
  node: ExpressionNode,
  context: CodegenContext
) {
  const { push } = context
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    // 如在生成动态v-on指令参数节点 - 属性值节点 渲染片段，如 template: <div @[someEvent]="handleEvent">hello {{ someone }} !</div>
    // 其中 属性值@[someEvent] 所对应的节点为 createCompoundExpression，在v-on transform 中解析
    // node.children: ['_toHandlerKey(', arg, ')'] // 指令名参数ast节点
    // 则 code += '[_toHandlerKey(someEvent)]'
    push(`[`)
    genCompoundExpression(node, context) // 则 code += '_toHandlerKey(someEvent)'
    push(`]`)
  } else if (node.isStatic) {
    // only quote keys if necessary
    // 如 静态属性/静态指令节点 template: '<div class="red" :style="\'color:blue;\'" @click="handleClick">hello {{ someone }} !</div>'
    // 其中的静态class属性名节点，注意 如果没有动态属性的话，都是静态属性，则在transform阶段会发生props静态提升转换，则不会走该流程，props被标记为静态类型 SIMPLE_EXPRESSION，content: "_hoisted_X"
    const text = isSimpleIdentifier(node.content) // 非数字开头，且都是'[\$A-Za-z0-9_]'，如：'$foo_123'
      ? node.content // 'class'、'style'、onClick
      : JSON.stringify(node.content)
    push(text, node)
  } else {
    // 处理动态指令参数
    // 如：<div class="red" :[attrObjs]="someAttrs">hello {{ someone }} !</div>
    // 则：node.content = 'attrObjs || ""'
    // 则 code += '['attrObjs || ""']'
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

// 生成标签元素节点的code，如 标签元素、if节点、for节点
// 如 template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
// 则 code += '(_openBlock(), _createBlock("div", {\n   style: "color: blue;",\n   class: "red",\n   onClick: "handleClick"}, "hello " + _toDisplayString(someone) + " !, 11 /* TEXT, CLASS, PROPS */, ["onClick"]))'
// 最终：code =
// 'const _Vue = Vue
//
// return function render(_ctx, _cache) {
//   with (_ctx) {
//     const { toDisplayString: _toDisplayString, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = _Vue
//
//     return (_openBlock(), _createBlock("div", {
//       style: {"color":"blue"},
//       class: red,
//       onClick: handleClick
//     }, "hello " + _toDisplayString(someone) + " !", 11 /* TEXT, CLASS, PROPS */, ["onClick"]))
//   }
// }'
// 如果 存在自定义指令则 'return _withDirectives((_openBlock(), _createBlock(...)), 自定义指令code... )'
function genVNodeCall(node: VNodeCall, context: CodegenContext) {
  const { push, helper, pure } = context
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps, // 动态属性，不包括 ref、class、style，如 '<input :class="red" style="..." :placeholder="xxx" @click="handleClick" />' 其中的 placeholder、onClick属性
    directives,
    isBlock,
    disableTracking
  } = node
  if (directives) {
    // 需要在运行时，重新处理的指令，如：v-model、v-show、用户自定义指令
    // e.g template: '<div v-user-directive>hello {{ who }} !</div>', 则 '_withDirectives('
    push(helper(WITH_DIRECTIVES) + `(`) //
  }
  if (isBlock) {
    // disableTracking 默认false
    // e.g template: '<div v-user-directive>hello {{ who }} !</div>', 则 '_openBlock(), '
    // e.g template: '<div v-for="item in items">hello {{ item }} !</div>', 则 '_openBlock(true), '
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `) // '_openBlock(
  }
  if (pure) {
    // 默认false
    push(PURE_ANNOTATION)
  }
  // 如 template: '<div>hello {{ item }}</div>', 则 '_createBlock('
  push(helper(isBlock ? CREATE_BLOCK : CREATE_VNODE) + `(`, node)

  // 生成 标签节点、属性节点、子节点、patchFlag、dynamicProps节点的 渲染代码
  // 如 template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
  // 则：tag: '"div"',
  //    props:
  //        '{
  //            style: {"color": "blue"},
  //            class: red,
  //            onClick: handleClick
  //         }'
  //    children: '"hello " + _toDisplayString(someone) + " !'
  //    patchFlag: 11 /* TEXT, CLASS, PROPS */'
  //    dynamicProps: '["onClick"]'  // 动态属性
  // 则结果为： code +=
  // '"div", {\n   style: "color: blue;",\n   class: red,\n   onClick: "handleClick"}, "hello " + _toDisplayString(someone) + " !, 11 /* TEXT, CLASS, PROPS */, ["onClick"]'
  genNodeList(
    // 生成 null值参数 的渲染代码
    // genNullableArgs(arg1, arg2, arg3, null), 则 [arg1, arg2, arg3] // 最后的直接截断
    // genNullableArgs(arg1, arg2, null, arg3), 则 [arg1, arg2, 'null', arg3]
    genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
    context
  )
  push(`)`)
  if (isBlock) {
    push(`)`)
  }

  // '_withDirectives((..., ...) ...)'
  if (directives) {
    push(`, `)
    genNode(directives, context)
    push(`)`)
  }
}

// 生成参数null值的渲染代码
function genNullableArgs(args: any[]): CallExpression['arguments'] {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  // genNullableArgs(arg1, arg2, arg3, null), 则 [arg1, arg2, arg3]
  // genNullableArgs(arg1, arg2, null, arg3), 则 [arg1, arg2, 'null', arg3]
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
    // 静态提升、单独使用函数时
    push(PURE_ANNOTATION) // context.code += `/*#_PURE__*/`   // 注意 此注释 __PURE__ 故意写错，否则导致源码不能调试，即之后的一行push(...) 没有执行
  }
  push(callee + `(`, node)
  // 转换参数个数，如静态节点 'abc'
  // context.code += 'abc'
  genNodeList(node.arguments, context)
  push(`)`)

  // 最终
  // context.code += '/*#__PURE__*/_createTextVNode("abc")'
}

// 生成节点的属性props节点列表的渲染片段， 对象表达式格式
// 该情况当node props类型 不包含v-on/v-bind无参数属性时才为ObjectExpression
// 注意：如果都是静态属性，则会被静态标记，不会走该流程
// 如 template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
// 则 props 包含: style、class、onClick，解析过程在transformElements中的buildProps
// 结果： '{\n   style: "color: blue;",\n   class: "red",\n   onClick: "handleClick"}'
function genObjectExpression(node: ObjectExpression, context: CodegenContext) {
  const { push, indent, deindent, newline } = context

  // 如 template: <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
  // 则 properties 包含: style、class、onClick
  // 则 解析结果为 code += '{\n   style: "color: blue;",\n   class: "red",\n   onClick: "handleClick"}'

  const { properties } = node // node 为 props节点，注意去重合并的prop节点类型为JS_ARRAY_EXPRESSION
  if (!properties.length) {
    push(`{}`, node)
    return
  }
  const multilines =
    properties.length > 1 ||
    ((!__BROWSER__ || __DEV__) &&
      properties.some(p => p.value.type !== NodeTypes.SIMPLE_EXPRESSION))
  push(multilines ? `{` : `{ `)
  multilines && indent() // 换行并缩进

  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i]
    // key 生成属性值 节点渲染片段
    // 1、动态v-on, 则 code += '_toHandlerKey(someEvent)'
    // 2、静态属性/指令 isStatic true, 则 code += 'class' 或 'style' 或 ...
    // 3、动态指令 isStatic false, 则 code += '['attrObjs || ""']'
    // 4、动态属性可能要考虑驼峰转换 'Symbol('camelize')(prop-name || "")'
    genExpressionAsPropertyKey(key, context)
    push(`: `)

    // value
    // 1、静态属性节点：SIMPLE_EXPRESSION，如 <div style="color: blue;" :class="red" @click="handleClick">hello {{ someone }} !</div>
    // 静态style属性值节点内容 code += '{"color": "blue"}' // 注意经过transformStyle处理
    // 静态指令属性class属性值节点内容 code += 'red'  // 这个是动态的 isStatic false
    // 静态指令click属性值节点内容，需要考虑单语句、多行表达式、修饰符， code += 'handleClick'
    // 2、指令: on、bind、model、html、text、show、cloak，注意其它指令v-if/v-for/slot等 transform会注入特有属性injectProps，比如key
    // 3、注意去重合并的prop节点类型为value.type = JS_ARRAY_EXPRESSION， value.elements = [mergeProp1.value, mergeProp2.value, ...]
    // 如 <div class="blue" :class="red">hello</div>，则 code += '["blue", red]'
    genNode(value, context) // value解析过程主要在 buildProps、injectProps
    if (i < properties.length - 1) {
      // will only reach this if it's multilines
      push(`,`)
      newline()
    }
  }
  multilines && deindent()
  push(multilines ? `}` : ` }`)
}

// 处理合并属性节点 <div class="blue" :class="red">hello</div>
// 去重合并的prop节点类型为value.type = JS_ARRAY_EXPRESSION， value.elements = [mergeProp1.value, mergeProp2.value, ...]
// 结果为： code += '[blue, red]'
function genArrayExpression(node: ArrayExpression, context: CodegenContext) {
  genNodeListAsArray(node.elements, context) // 数组包裹起来
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
