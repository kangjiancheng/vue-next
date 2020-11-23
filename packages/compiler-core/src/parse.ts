/**
 * 解析模板template，得到ast语法树
 */

import { ParserOptions } from './options'
import { NO, isArray, makeMap, extend } from '@vue/shared'
import { ErrorCodes, createCompilerError, defaultOnError } from './errors'
import {
  assert,
  advancePositionWithMutation,
  advancePositionWithClone,
  isCoreComponent
} from './utils'
import {
  Namespaces,
  AttributeNode,
  CommentNode,
  DirectiveNode,
  ElementNode,
  ElementTypes,
  ExpressionNode,
  NodeTypes,
  Position,
  RootNode,
  SourceLocation,
  TextNode,
  TemplateChildNode,
  InterpolationNode,
  createRoot,
  ConstantTypes
} from './ast'

type OptionalOptions = 'isNativeTag' | 'isBuiltInComponent'
type MergedParserOptions = Omit<Required<ParserOptions>, OptionalOptions> &
  Pick<ParserOptions, OptionalOptions>

// The default decoder only provides escapes for characters reserved as part of
// the template syntax, and is only used if the custom renderer did not provide
// a platform-specific decoder.
const decodeRE = /&(gt|lt|amp|apos|quot);/g
const decodeMap: Record<string, string> = {
  gt: '>',
  lt: '<',
  amp: '&',
  apos: "'",
  quot: '"'
}

export const defaultParserOptions: MergedParserOptions = {
  delimiters: [`{{`, `}}`],
  getNamespace: () => Namespaces.HTML,
  getTextMode: () => TextModes.DATA,
  isVoidTag: NO,
  isPreTag: NO,
  isCustomElement: NO,
  decodeEntities: (rawText: string): string =>
    rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
  onError: defaultOnError,
  comments: false
}

export const enum TextModes {
  //                | Elements | Entities  | End sign              | Inside of
  DATA, // | ✔        | ✔        | End tags of ancestors |
  RCDATA, // | ✘        | ✔        | End tag of the parent | <textarea>
  RAWTEXT, // | ✘        | ✘        | End tag of the parent | <style>,<script>
  CDATA,
  ATTRIBUTE_VALUE
}

export interface ParserContext {
  options: MergedParserOptions
  readonly originalSource: string
  source: string
  offset: number
  line: number
  column: number
  inPre: boolean // HTML <pre> tag, preserve whitespaces
  inVPre: boolean // v-pre, do not process directives and interpolations
}

/**
 * 解析模板template，得到ast语法树
 * @param content - 模板template内容(innerHTML)
 * @param options - 解析选项
 */
export function baseParse(
  content: string,
  options: ParserOptions = {}
): RootNode {
  // 创建解析环境，记录解析进度
  const context = createParserContext(content, options)

  // 获取解析位置
  const start = getCursor(context)

  return createRoot(
    parseChildren(context, TextModes.DATA, []),
    getSelection(context, start)
  )
}

// 创建解析上下文，为了记录解析进度
function createParserContext(
  content: string,
  rawOptions: ParserOptions
): ParserContext {
  // 初始化 解析options
  const options = extend({}, defaultParserOptions)
  for (const key in rawOptions) {
    // 将rawOptions存在值的key 添加到 options：等价于 =》 if (rawOptions[key]) options[key] = rawOptions[key]
    // @ts-ignore
    options[key] = rawOptions[key] || defaultParserOptions[key]
  }

  return {
    options,
    column: 1, // 当前列（索引以1开始），这三个属性 定位光标解析起始位置
    line: 1, // 当前行
    offset: 0, // 当前操作的模板字符串source的起始位置
    originalSource: content, // 模板代码 innerHTML，开头包括换行和代码缩进（缩进以空格表示）
    source: content, // 当前正在操作的模板内容，即 originalSource.slice(offset)
    inPre: false,
    inVPre: false
  }
}

function parseChildren(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): TemplateChildNode[] {
  const parent = last(ancestors)
  const ns = parent ? parent.ns : Namespaces.HTML
  const nodes: TemplateChildNode[] = []

  // 如果不是结束边界，就继续解析
  while (!isEnd(context, mode, ancestors)) {
    __TEST__ && assert(context.source.length > 0)
    const s = context.source
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined

    // 解析识别优先级为：解析插值{{}} > 解析注释与解析并注释特殊标签内容(如：CDATA标签) > 解析结束标签 > 解析开始标签 > 解析文本内容
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // '{{' 解析插值、delimiters = ['{{', '}}']
      if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
        node = parseInterpolation(context, mode)
      } else if (mode === TextModes.DATA && s[0] === '<') {
        // 解析注释、结束标签、开始标签、 注释特殊注释标签(如'<!DOCTYPE>' =》 '<!--DOCTYPE-->')
        // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
        if (s.length === 1) {
          // 不可以在模板中直接使用 '<'，如： template: '<span> 1 < 2</span>'，会被当作是一个结束标签
          // 如果在dom文档树中，如 <span>1 < 2<span> 其中的小于号通过innerHTML会被转译为 '&lt;'，所以在模板中实际内容为<span>1 &lt; 2</span>
          emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 1)
        } else if (s[1] === '!') {
          // '<!'
          // https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
          if (startsWith(s, '<!--')) {
            // <!-- 解析注释，并返回注释内容节点，同时校验注释格式 -->
            node = parseComment(context)
          } else if (startsWith(s, '<!DOCTYPE')) {
            // Ignore DOCTYPE by a limitation.
            // 注释标签内容'<!DOCTYPE html>' 转换为 '<!--DOCTYPE html-->' 并返回
            node = parseBogusComment(context)
          } else if (startsWith(s, '<![CDATA[')) {
            // XHTML(及 XML)中，CDATA 块表示 文档中可以包含任意文本的区块，其内容不作为标签来解析，避免发生语法错误，如：小于号 '<'
            if (ns !== Namespaces.HTML) {
              // 解析 <![CDATA[ html模板内容 ]]>
              node = parseCDATA(context, ancestors)
            } else {
              // CDATA 是为在xhtml文档中能正常解析html语法格式的代码，没必要在html文档中出现
              emitError(context, ErrorCodes.CDATA_IN_HTML_CONTENT)
              // 注释CDATA内容，并返回注释节点
              node = parseBogusComment(context)
            }
          } else {
            // 错误的注释标志，如：'<!doc>'
            emitError(context, ErrorCodes.INCORRECTLY_OPENED_COMMENT)
            // 注释 错误的注释标志内容，如 '<!--doc-->'
            node = parseBogusComment(context)
          }
        } else if (s[1] === '/') {
          // 优先 解析 结束标签'</'，因为如果一开始就存在结束标签，是错误的。
          // https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
          if (s.length === 2) {
            // s = '</'，不完整的结束标签
            emitError(context, ErrorCodes.EOF_BEFORE_TAG_NAME, 2)
          } else if (s[2] === '>') {
            // s = '</>'，空结束标签
            emitError(context, ErrorCodes.MISSING_END_TAG_NAME, 2)
            advanceBy(context, 3)
            continue
          } else if (/[a-z]/i.test(s[2])) {
            // template = 'abc</p', s = '</p' 只有结束标志
            emitError(context, ErrorCodes.X_INVALID_END_TAG)
            parseTag(context, TagType.End, parent)
            continue
          } else {
            // s = '</123>' 无效的结束标签
            emitError(
              context,
              ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME,
              2
            )
            // 注释无效标签：s = '</123>' => <!--123-->
            node = parseBogusComment(context)
          }
        } else if (/[a-z]/i.test(s[1])) {
          // s = '<p' 开始标志
          node = parseElement(context, ancestors)
        } else if (s[1] === '?') {
          // '<?' xml 格式
          emitError(
            context,
            ErrorCodes.UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME,
            1
          )
          node = parseBogusComment(context)
        } else {
          emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 1)
        }
      }
    }

    // 解析文本包括换行、空格，且以 ['<', '{{', ']]>'] 为结束边界
    if (!node) {
      // 获取文本节点
      node = parseText(context, mode)
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }
  }

  // Whitespace management for more efficient output
  // (same as v2 whitespace: 'condense')
  let removedWhitespace = false
  if (mode !== TextModes.RAWTEXT) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (!context.inPre && node.type === NodeTypes.TEXT) {
        if (!/[^\t\r\n\f ]/.test(node.content)) {
          const prev = nodes[i - 1]
          const next = nodes[i + 1]
          // If:
          // - the whitespace is the first or last node, or:
          // - the whitespace is adjacent to a comment, or:
          // - the whitespace is between two elements AND contains newline
          // Then the whitespace is ignored.
          if (
            !prev ||
            !next ||
            prev.type === NodeTypes.COMMENT ||
            next.type === NodeTypes.COMMENT ||
            (prev.type === NodeTypes.ELEMENT &&
              next.type === NodeTypes.ELEMENT &&
              /[\r\n]/.test(node.content))
          ) {
            removedWhitespace = true
            nodes[i] = null as any
          } else {
            // Otherwise, condensed consecutive whitespace inside the text
            // down to a single space
            node.content = ' '
          }
        } else {
          node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
        }
      }
      // also remove comment nodes in prod by default
      if (
        !__DEV__ &&
        node.type === NodeTypes.COMMENT &&
        !context.options.comments
      ) {
        removedWhitespace = true
        nodes[i] = null as any
      }
    }
    if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
      // remove leading newline per html spec
      // https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
      const first = nodes[0]
      if (first && first.type === NodeTypes.TEXT) {
        first.content = first.content.replace(/^\r?\n/, '')
      }
    }
  }

  return removedWhitespace ? nodes.filter(Boolean) : nodes
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    // Merge if both this and the previous node are text and those are
    // consecutive. This happens for cases like "a < b".
    if (
      prev &&
      prev.type === NodeTypes.TEXT &&
      prev.loc.end.offset === node.loc.start.offset
    ) {
      prev.content += node.content
      prev.loc.end = node.loc.end
      prev.loc.source += node.loc.source
      return
    }
  }

  nodes.push(node)
}

/**
 * namespace 不是html时，即可能是 xhtml时，解析 '<![CDATA[ html代码]>' 其中的模板内容
 * @param context
 * @param ancestors
 */
function parseCDATA(
  context: ParserContext,
  ancestors: ElementNode[]
): TemplateChildNode[] {
  __TEST__ &&
    assert(last(ancestors) == null || last(ancestors)!.ns !== Namespaces.HTML)
  __TEST__ && assert(startsWith(context.source, '<![CDATA['))

  advanceBy(context, 9) // 移动光标距离为： '<![CDATA['.length

  // 解析 '<![CDATA[ html代码 ]]>' 之间的内容
  const nodes = parseChildren(context, TextModes.CDATA, ancestors)
  if (context.source.length === 0) {
    emitError(context, ErrorCodes.EOF_IN_CDATA)
  } else {
    __TEST__ && assert(startsWith(context.source, ']]>'))
    advanceBy(context, 3)
  }

  return nodes
}

/**
 * 解析注释： <!--正常注释-->、处理无效注释'a<!--bc'、不规范注释'<!-->'、处理嵌套注释'<!--<!--a-->123'、
 *    源码调试注释时，推荐直接编辑模版的template属性，如 template: '<!-- abc -->'，
 *    因为如果通过dom标签得到的template，其innerHTML 输出的注释会与源码有区别，如 <!-->的innerHTML 为 '<!---->'
 * @param context
 * @return 返回已解析的注释节点配置
 */
function parseComment(context: ParserContext): CommentNode {
  __TEST__ && assert(startsWith(context.source, '<!--'))

  const start = getCursor(context)
  let content: string

  // Regular comment: 结束边界：'-->' 或 '--!>'(其innerHTML为 '-->')
  const match = /--(\!)?>/.exec(context.source)
  if (!match) {
    // 如果没有匹配到：如 template = 'a<!--bc'
    content = context.source.slice(4) // 截取 '<!--' 之后的内容
    advanceBy(context, context.source.length) // 直接将光标移动到结束位置，结束处理
    emitError(context, ErrorCodes.EOF_IN_COMMENT) // 触发控制台错误，在compiler 函数定义时，定义错误处理
  } else {
    // match.index 为'-->'匹配到的位置，如：'<!--a-->'，其 match.index = 5

    if (match.index <= 3) {
      // 不合理注释如: template =  '<!-->'  或 '<!--->'
      emitError(context, ErrorCodes.ABRUPT_CLOSING_OF_EMPTY_COMMENT)
    }
    if (match[1]) {
      // 捕获0为匹配的内容，捕获组1为 '(\!)' 括号里的内容
      // match[1] = '!' 如 template = '<!-- abc --!>'，不规范的关闭注释
      emitError(context, ErrorCodes.INCORRECTLY_CLOSED_COMMENT)
    }
    // 获取注释内容，不影响原source
    content = context.source.slice(4, match.index)

    // 处理嵌套注释，如：template = '<!--<!--a-->123'，则 match.index = 9
    // Advancing with reporting nested comments.
    const s = context.source.slice(0, match.index) // s = '<!--<!--a'
    let prevIndex = 1, // 开始查找位置
      nestedIndex = 0 // 嵌套位置
    while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
      // 移动光标位置，同时更新下次要解析的模版内容：context.source = '<!--a-->123'
      advanceBy(context, nestedIndex - prevIndex + 1)

      // s = '<!--<!--a'，nestedIndex = 4，length = 9
      if (nestedIndex + 4 < s.length) {
        // 存在嵌套注释
        emitError(context, ErrorCodes.NESTED_COMMENT)
      }
      // 更新下一轮起始位置，如：s='<!--<!--a'，prevIndex = 5
      prevIndex = nestedIndex + 1
    }

    // 如: template='<!--<!--a-->123'，此时解析内容context.source为：'<!--a-->123'，
    // match.index = 9, match[0] 为匹配到的结束注释 '-->' 3, prevIndex = 5
    // 则计算出 advanceBy 需移动光标距离：总注释长度（match.index + match[0].length） - 已解析的注释长度（prevIndex） + 1
    advanceBy(context, match.index + match[0].length - prevIndex + 1)
  }

  // 返回注释内容节点
  return {
    type: NodeTypes.COMMENT,
    content,
    loc: getSelection(context, start) // 注释范围起始点与注释源码（包括标签）
  }
}

// 注释 特殊标签如: '<!DOCTYPE html>' 或 '<![CDATA[123...]]>' 或无效结束标签 '</123>' 等
// 注释特殊标签，并返回注释内容，如： '<!--DOCTYPE html-->' 或 '[CDATA[123...]]' 或 '<!--123-->'
function parseBogusComment(context: ParserContext): CommentNode | undefined {
  __TEST__ && assert(/^<(?:[\!\?]|\/[^a-z>])/i.test(context.source))

  // 获取当前光标位置，即当前模板解析起始位置
  const start = getCursor(context)
  const contentStart = context.source[1] === '?' ? 1 : 2 // <?xml、<!DOCTYPE、</123>等
  let content: string

  const closeIndex = context.source.indexOf('>')
  if (closeIndex === -1) {
    // 没有结束边界，直接结束解析，并注释之后所有内容
    content = context.source.slice(contentStart)
    advanceBy(context, context.source.length) // 光标移动到结束位置
  } else {
    content = context.source.slice(contentStart, closeIndex) // 获取注释内容
    advanceBy(context, closeIndex + 1) // 光标移动到结束边界的下个位置
  }

  return {
    type: NodeTypes.COMMENT,
    content, // 注释内容
    loc: getSelection(context, start) // 注释内容在模板中的起始和终止位置，还有对应的模板内容
  }
}

/**
 * 解析元素
 */
function parseElement(
  context: ParserContext,
  ancestors: ElementNode[]
): ElementNode | undefined {
  __TEST__ && assert(/^<[a-z]/i.test(context.source))

  // Start tag.
  const wasInPre = context.inPre
  const wasInVPre = context.inVPre
  const parent = last(ancestors)
  // 解析元素标签：指令等
  const element = parseTag(context, TagType.Start, parent)
  // 是否被 pre 标签包裹
  const isPreBoundary = context.inPre && !wasInPre
  // 是否使用 v-pre 指令
  const isVPreBoundary = context.inVPre && !wasInVPre

  // 自闭元素 或自闭标签 <br />、<img />、<input /> 等：@vue/shared/src/domTagConfig.ts
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }

  // Children.
  ancestors.push(element)
  const mode = context.options.getTextMode(element, parent)
  const children = parseChildren(context, mode, ancestors)
  ancestors.pop()

  element.children = children

  // End tag.
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent)
  } else {
    emitError(context, ErrorCodes.X_MISSING_END_TAG, 0, element.loc.start)
    if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
      const first = children[0]
      if (first && startsWith(first.loc.source, '<!--')) {
        emitError(context, ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT)
      }
    }
  }

  element.loc = getSelection(context, element.loc.start)

  if (isPreBoundary) {
    context.inPre = false
  }
  if (isVPreBoundary) {
    context.inVPre = false
  }
  return element
}

const enum TagType {
  Start,
  End
}

const isSpecialTemplateDirective = /*#__PURE__*/ makeMap(
  `if,else,else-if,for,slot`
)

/**
 * 解析标签，如：开始标签'<div>' 或 结束标签 '</div>'
 */
function parseTag(
  context: ParserContext,
  type: TagType, // 开始或结束
  parent: ElementNode | undefined
): ElementNode {
  __TEST__ && assert(/^<\/?[a-z]/i.test(context.source))
  __TEST__ &&
    assert(
      type === (startsWith(context.source, '</') ? TagType.End : TagType.Start)
    )

  // 解析标签，如：context.source = '<span class="abc" :hello="123">'
  const start = getCursor(context) // 获取当前模板解析所在位置
  // 匹配标签名（开始标签或结束标签），标签名之间不能有：空格、/、>、制页符
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)! // 结尾 '!' ts语法 ，即match 排除 null
  // 捕获组1，括号内容：标签名 - 'span'
  const tag = match[1]
  // 默认 Namespaces.HTML
  const ns = context.options.getNamespace(tag, parent)

  // 解析标签名完成，继续移动光标距离，match[0] 为匹配到到内容，如: '<span'.length = 5
  advanceBy(context, match[0].length)
  // 跳过 开头为：空格、换行等，如：context.source = ' class="abc">'
  advanceSpaces(context)
  // 此时 context.source = 'class="abc">'

  // save current state in case we need to re-parse attributes with v-pre
  // 保存当前解析状态，光标位置，与当前解析内容 （已跳过标签）
  const cursor = getCursor(context)
  const currentSource = context.source

  // 解析 props 属性
  // Attributes.
  let props = parseAttributes(context, type)

  // check <pre> tag
  if (context.options.isPreTag(tag)) {
    context.inPre = true
  }

  // check v-pre
  if (
    !context.inVPre &&
    props.some(p => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')
  ) {
    context.inVPre = true
    // reset context
    extend(context, cursor)
    context.source = currentSource
    // re-parse attrs and filter out v-pre itself
    props = parseAttributes(context, type).filter(p => p.name !== 'v-pre')
  }

  // Tag close.
  let isSelfClosing = false
  if (context.source.length === 0) {
    emitError(context, ErrorCodes.EOF_IN_TAG)
  } else {
    isSelfClosing = startsWith(context.source, '/>')
    if (type === TagType.End && isSelfClosing) {
      emitError(context, ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS)
    }
    advanceBy(context, isSelfClosing ? 2 : 1)
  }

  let tagType = ElementTypes.ELEMENT
  const options = context.options
  if (!context.inVPre && !options.isCustomElement(tag)) {
    const hasVIs = props.some(
      p => p.type === NodeTypes.DIRECTIVE && p.name === 'is'
    )
    if (options.isNativeTag && !hasVIs) {
      if (!options.isNativeTag(tag)) tagType = ElementTypes.COMPONENT
    } else if (
      hasVIs ||
      isCoreComponent(tag) ||
      (options.isBuiltInComponent && options.isBuiltInComponent(tag)) ||
      /^[A-Z]/.test(tag) ||
      tag === 'component'
    ) {
      tagType = ElementTypes.COMPONENT
    }

    if (tag === 'slot') {
      tagType = ElementTypes.SLOT
    } else if (
      tag === 'template' &&
      props.some(p => {
        return (
          p.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(p.name)
        )
      })
    ) {
      tagType = ElementTypes.TEMPLATE
    }
  }

  return {
    type: NodeTypes.ELEMENT,
    ns,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    loc: getSelection(context, start),
    codegenNode: undefined // to be created during transform phase
  }
}

/**
 * 解析标签上的属性列表
 * @param context
 * @param type：开始标签或结束标签
 */
function parseAttributes(
  context: ParserContext,
  type: TagType
): (AttributeNode | DirectiveNode)[] {
  const props = []
  const attributeNames = new Set<string>()

  // 以 context.source = '' 或 '>...' 或 '/>...' 为结束解析标签属性
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    // 标签属性上不能有：'/'，如：context.source = <span / class="abc"></span>' (注意：前边的标签名 '<span ' 已经解析了，现在在解析标签上的属性)
    if (startsWith(context.source, '/')) {
      emitError(context, ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG)
      advanceBy(context, 1)
      advanceSpaces(context)
      continue // 当前为无效属性，无需记录，直接继续解析后边属性
    }

    // 结束标签上不能有属性，如: '</span class="abc">'，注意：标签名 '</span ' 已经解析了，现在在解析 'class="abc">'
    if (type === TagType.End) {
      emitError(context, ErrorCodes.END_TAG_WITH_ATTRIBUTES)
    }

    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      props.push(attr)
    }

    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    }
    advanceSpaces(context)
  }

  return props
}

/**
 * 解析标签上的某一个属性
 * @param context
 * @param nameSet，元素标签属性列表集合
 */
function parseAttribute(
  context: ParserContext,
  nameSet: Set<string>
): AttributeNode | DirectiveNode {
  __TEST__ && assert(/^[^\t\r\n\f />]/.test(context.source))

  // 解析属性名，如：context.source = 'class="abc" :hello="123"></span>'
  const start = getCursor(context) // 记录当前光标解析位置
  // 匹配属性名，不能以：'空格、/、>' 开头， 且以：'空格、换行、/、>、=' 为结束边界
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  // match[0] 为 匹配到的内容: 'class'
  const name = match[0]

  // 校验属性名

  // 属性名 不能重复
  if (nameSet.has(name)) {
    emitError(context, ErrorCodes.DUPLICATE_ATTRIBUTE)
  }
  nameSet.add(name)
  // 属性名 不能以 '=' 开头，如：'<span =="abc"></span>'
  if (name[0] === '=') {
    emitError(context, ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME)
  }
  // 在一个块级域中处理
  {
    // 属性名不能含有以下字符
    const pattern = /["'<]/g
    let m: RegExpExecArray | null
    while ((m = pattern.exec(name))) {
      // 如：<span cl"as's<="abc">，则 name = `cla"as's<`
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME,
        m.index // 匹配到的错误位置，如：name = `cla"as's<`，m.index = 3
      )
    }
  }

  // 完成解析：属性名，前进解析光标、模版中移除解析名
  advanceBy(context, name.length)

  // 开始解析：属性值
  let value:
    | {
        content: string
        isQuoted: boolean
        loc: SourceLocation
      }
    | undefined = undefined
  // 属性值在 '=' 之后，如：template: '<span class = "abc">'，此时 context.source: ' = "abc">'，注意可以 空格、换行 开头
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context) // 跳过空格
    advanceBy(context, 1) // 跳过 '='
    advanceSpaces(context) // 跳过空格
    // 解析属性值
    // 属性值 可以设置引号，template: '<span class = "abc">'
    // 也可以没有，template: '<span class = abc>'，如果开始没有引号，则其结束边界为：空格、>，同时属性值内容不能有：引号、空格、<
    // 结果都是：class="abc"
    value = parseAttributeValue(context) // 返回属性值节点

    // 有 '=' 时，必须有属性值
    if (!value) {
      emitError(context, ErrorCodes.MISSING_ATTRIBUTE_VALUE)
    }
  }
  // 记录 所解析属性名与属性值 的位置
  const loc = getSelection(context, start)

  // 解析完成：属性值

  if (!context.inVPre && /^(v-|:|@|#)/.test(name)) {
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
      name
    )!

    const dirName =
      match[1] ||
      (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot')

    let arg: ExpressionNode | undefined

    if (match[2]) {
      const isSlot = dirName === 'slot'
      const startOffset = name.indexOf(match[2])
      const loc = getSelection(
        context,
        getNewPosition(context, start, startOffset),
        getNewPosition(
          context,
          start,
          startOffset + match[2].length + ((isSlot && match[3]) || '').length
        )
      )
      let content = match[2]
      let isStatic = true

      if (content.startsWith('[')) {
        isStatic = false

        if (!content.endsWith(']')) {
          emitError(
            context,
            ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END
          )
        }

        content = content.substr(1, content.length - 2)
      } else if (isSlot) {
        // #1241 special case for v-slot: vuetify relies extensively on slot
        // names containing dots. v-slot doesn't have any modifiers and Vue 2.x
        // supports such usage so we are keeping it consistent with 2.x.
        content += match[3] || ''
      }

      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: isStatic
          ? ConstantTypes.CAN_STRINGIFY
          : ConstantTypes.NOT_CONSTANT,
        loc
      }
    }

    if (value && value.isQuoted) {
      const valueLoc = value.loc
      valueLoc.start.offset++
      valueLoc.start.column++
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content)
      valueLoc.source = valueLoc.source.slice(1, -1)
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // other values by `transformExpression` to make it eligible for hoisting.
        constType: ConstantTypes.NOT_CONSTANT,
        loc: value.loc
      },
      arg,
      modifiers: match[3] ? match[3].substr(1).split('.') : [],
      loc
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc
  }
}

/**
 * 解析属性值（属性值在 '=' 之后），并返回属性值节点
 */
function parseAttributeValue(
  context: ParserContext
):
  | {
      content: string
      isQuoted: boolean
      loc: SourceLocation
    }
  | undefined {
  const start = getCursor(context)
  let content: string

  // 如，template：'<span class = "abc"></span>'
  // 此时，context.source：'"abc"></span>'
  const quote = context.source[0]
  const isQuoted = quote === `"` || quote === `'`
  if (isQuoted) {
    // 属性值以 单/双引号 开头
    advanceBy(context, 1) // 跳过 开始引号

    const endIndex = context.source.indexOf(quote)
    if (endIndex === -1) {
      // 如：template = '<span class = "abc></span>'，则属性值为: content = 'abc></span>'
      content = parseTextData(
        // 获取解析文本，并移动光标
        context,
        context.source.length, // 后边所有待解析的内容都是属性值
        TextModes.ATTRIBUTE_VALUE
      )
    } else {
      // 解析引号之间的内容，返回属性值内容，并移动光标
      content = parseTextData(context, endIndex, TextModes.ATTRIBUTE_VALUE)
      advanceBy(context, 1) // 跳过 结束引号
    }
  } else {
    // 属性值没有引号包裹，且以：'空格、换行、>' 为结束边界
    // 如：template = '<span class = abc></span>'，此时：context.source = 'abc></span>'，则class的属性值为：'abc'
    const match = /^[^\t\r\n\f >]+/.exec(context.source)
    if (!match) {
      // 没有设置属性值，如: template = '<span class = ></span>'，context.source = '></span>'
      return undefined
    }

    // 属性值若不以引号开头，则不能有以下字符
    const unexpectedChars = /["'<=`]/g
    let m: RegExpExecArray | null
    while ((m = unexpectedChars.exec(match[0]))) {
      // match[0]： 匹配到的内容 'abc'
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE,
        m.index
      )
    }
    // 获取属性值内容
    content = parseTextData(context, match[0].length, TextModes.ATTRIBUTE_VALUE)
  }

  // 返回属性值内容节点信息
  return { content, isQuoted, loc: getSelection(context, start) }
}

function parseInterpolation(
  context: ParserContext,
  mode: TextModes
): InterpolationNode | undefined {
  const [open, close] = context.options.delimiters
  __TEST__ && assert(startsWith(context.source, open))

  const closeIndex = context.source.indexOf(close, open.length)
  if (closeIndex === -1) {
    emitError(context, ErrorCodes.X_MISSING_INTERPOLATION_END)
    return undefined
  }

  const start = getCursor(context)
  advanceBy(context, open.length)
  const innerStart = getCursor(context)
  const innerEnd = getCursor(context)
  const rawContentLength = closeIndex - open.length
  const rawContent = context.source.slice(0, rawContentLength)
  const preTrimContent = parseTextData(context, rawContentLength, mode)
  const content = preTrimContent.trim()
  const startOffset = preTrimContent.indexOf(content)
  if (startOffset > 0) {
    advancePositionWithMutation(innerStart, rawContent, startOffset)
  }
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset)
  advancePositionWithMutation(innerEnd, rawContent, endOffset)
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: ConstantTypes.NOT_CONSTANT,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  }
}

/**
 * 解析文本节点并返回： 解析并获取当前所处理的文本内容和位置
 */
function parseText(context: ParserContext, mode: TextModes): TextNode {
  __TEST__ && assert(context.source.length > 0)

  // 结束边界：<、{{、]]
  const endTokens = ['<', context.options.delimiters[0]]
  if (mode === TextModes.CDATA) {
    // xhtml
    endTokens.push(']]>')
  }

  // 查找文本结束的位置，以 ['<', '{{'] 为结束边界，且优先以后边为准，如 '{{' 优先级高
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      // 调整结束边界，先识别 '<'， 然后进一步缩小结束范围 '{{'
      endIndex = index
    }
  }

  __TEST__ && assert(endIndex > 0)

  // 解析内容的开始位置
  const start = getCursor(context)
  // 获取解析文本内容
  const content = parseTextData(context, endIndex, mode)

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start) // 获取解析到的模板相关位置信息和内容
  }
}

/**
 * 解析文本内容并返回
 * Get text data with a given length from the current location.
 * This translates HTML entities in the text data.
 */
function parseTextData(
  context: ParserContext,
  length: number,
  mode: TextModes
): string {
  // 解析到的文本内容
  const rawText = context.source.slice(0, length)
  // 解析文本内容后，更新接下来要解析的内容和光标位置调整
  advanceBy(context, length)

  if (
    mode === TextModes.RAWTEXT ||
    mode === TextModes.CDATA ||
    rawText.indexOf('&') === -1
  ) {
    return rawText
  } else {
    // 解析属性值中的文本，如：template = '<span class="abc"></span>'，此时: rawText = 'abc'，作为属性值内容返回
    // 同时处理文本中表示 '&' 的html实体字符串（通过创建一个dom实例，将rawText作为innerHTML，然后获取其中的textContent，即可实现解析）
    return context.options.decodeEntities(
      rawText,
      mode === TextModes.ATTRIBUTE_VALUE // 3.0.2版本暂未发现有使用该参数
    )
  }
}

// 获取当前光标解析位置
function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context
  return { column, line, offset }
}

// 获取指定解析范围的模板内容
function getSelection(
  context: ParserContext,
  start: Position,
  end?: Position
): SourceLocation {
  end = end || getCursor(context) // 光标位置
  return {
    start,
    end, // 不包括结束位置的字符，end 为下一次解析内容的起始位置
    source: context.originalSource.slice(start.offset, end.offset) // 节点内容即该节点对应的模板内容
  }
}

// 获取数组最后一个元素
function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1]
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString)
}

/**
 * advance：前进，光标向前移动、模版内容向前解析
 * 重新定位之后要处理内容的光标位置信息和源码内容
 * @param numberOfCharacters  ，前进数量，即当前已解析的模版内容长度
 */
function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  const { source } = context
  __TEST__ && assert(numberOfCharacters <= source.length)
  // 重新定位之后要处理内容的光标位置信息，修改context光标定位信息
  advancePositionWithMutation(context, source, numberOfCharacters)
  context.source = source.slice(numberOfCharacters)
}

function advanceSpaces(context: ParserContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function getNewPosition(
  context: ParserContext,
  start: Position,
  numberOfCharacters: number
): Position {
  return advancePositionWithClone(
    start,
    context.originalSource.slice(start.offset, numberOfCharacters),
    numberOfCharacters
  )
}

// 提示错误，光标位置，解析范围
function emitError(
  context: ParserContext,
  code: ErrorCodes,
  offset?: number,
  loc: Position = getCursor(context) // 返回光标位置：结束位置（即模版长度）
): void {
  if (offset) {
    loc.offset += offset
    loc.column += offset
  }
  context.options.onError(
    createCompilerError(code, {
      start: loc,
      end: loc,
      source: ''
    })
  )
}

function isEnd(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): boolean {
  const s = context.source

  switch (mode) {
    case TextModes.DATA:
      if (startsWith(s, '</')) {
        // 模板代码 innerHTML，包括换行和缩进（缩进以空格表示）
        //TODO: probably bad performance
        for (let i = ancestors.length - 1; i >= 0; --i) {
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true
          }
        }
      }
      break

    case TextModes.RCDATA:
    case TextModes.RAWTEXT: {
      const parent = last(ancestors)
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        return true
      }
      break
    }

    case TextModes.CDATA:
      if (startsWith(s, ']]>')) {
        return true
      }
      break
  }

  return !s
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, '</') &&
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}
