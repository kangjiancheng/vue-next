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
type AttributeValue =
  | {
      content: string
      isQuoted: boolean
      loc: SourceLocation
    }
  | undefined

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
  // 创建解析上下文信息，记录解析进度等
  const context = createParserContext(content, options)

  // 获取解析位置
  const start = getCursor(context)

  // 创建语法树根节点
  return createRoot(
    parseChildren(context, TextModes.DATA, []), // 返回解析后的子元素列表
    getSelection(context, start) // 模版位置信息
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
    // 为了不影响之前的options
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
    inPre: false, // 当前解析上下文在 pre 标签内，如解析pre标签内的子元素
    inVPre: false // v-pre 指令内
  }
}

/**
 * 解析元素、子元素
 * @param context
 * @param mode  - 文本类型
 * @param ancestors - 祖先元素列表，即已解析的父元素
 */
function parseChildren(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[] // 祖先元素列表
): TemplateChildNode[] {
  const parent = last(ancestors) // 获取最近的祖先元素 即父元素
  const ns = parent ? parent.ns : Namespaces.HTML
  const nodes: TemplateChildNode[] = []

  // 如果是结束边界，如 是ancestors里的父元素对应的结束标签，则跳过
  while (!isEnd(context, mode, ancestors)) {
    __TEST__ && assert(context.source.length > 0)
    const s = context.source
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined

    // 解析识别优先级为：解析插值{{}} > 解析注释与解析并注释特殊标签内容(如：CDATA标签) > 解析结束标签 > 解析开始标签 > 解析文本内容
    // 不解析 RAWDATA 模式：style、script等标签
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // '{{' 解析插值、delimiters = ['{{', '}}']
      if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
        // 解析插值
        node = parseInterpolation(context, mode)
      } else if (mode === TextModes.DATA && s[0] === '<') {
        // 解析注释、结束标签、开始标签、 注释特殊注释标签(如'<!DOCTYPE>' =》 '<!--DOCTYPE-->')
        // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state

        // 注意：不可以在模板中直接使用 '<'，如： template: '<span> 1 < 2</span>'，会被当作是一个结束标签
        // 如果在dom文档树中，如： <span>1 < 2<span> 其中的小于号通过调用innerHTML会被转译为 '&lt;'，所以在模板中实际内容为 template: '<span>1 &lt; 2</span>'
        if (s.length === 1) {
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
          // 优先 解析 结束标签'</'， 因为如果是结束标签时，会先判断是否为ancestors中已解析元素对应的结束标签，有则跳过while循环解析。
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
          // s = '<p' 开始标签，解析标签名、标签属性、指令等
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
          // 如 template: 'a < b'，一个小于号
          // 此时： context.source = '< b'
          // 无效的标签符号，若要表示小于号，在template模版中 应该使用对应的html实体代表： &lt;
          emitError(context, ErrorCodes.INVALID_FIRST_CHARACTER_OF_TAG_NAME, 1)
        }
      }
    }

    // 解析文本包括换行、空格，且以 ['<', '{{', ']]>'] 为结束边界
    if (!node) {
      // 获取文本节点

      // 注意，如 template: 'a < b'，一个小于号，且小于号前边文本内容已解析完。
      // 此轮 while 解析: context.source = '< b'
      // 则 node = '< b'

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

  /**
   * 处理空白字符
   * 1、移除空内容节点
   * 2、将连续空格替换成一个空格
   */

  // Whitespace management for more efficient output
  // (same as v2 whitespace: 'condense')
  let removedWhitespace = false

  // 排除 TextModes.RAWTEXT，即标签为：style,iframe,script,noscript
  if (mode !== TextModes.RAWTEXT) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (!context.inPre && node.type === NodeTypes.TEXT) {
        // 文本节点，且当前上下文并不在pre标签里，即不去掉pre元素的文本内容的空白
        if (!/[^\t\r\n\f ]/.test(node.content)) {
          // 内容只有：换行、空白
          const prev = nodes[i - 1] // 前后相邻元素
          const next = nodes[i + 1]
          // If:
          // - the whitespace is the first or last node, or:
          // - the whitespace is adjacent to a comment, or:
          // - the whitespace is between two elements AND contains newline
          // Then the whitespace is ignored.
          if (
            !prev || // 前边没有相邻元素（首个元素）
            !next || // 后边没有相邻元素（最后元素）
            prev.type === NodeTypes.COMMENT || // 前边为注释元素
            next.type === NodeTypes.COMMENT || // 后边为注释元素
            (prev.type === NodeTypes.ELEMENT && // 前后都有相邻元素，且内容为换行
              next.type === NodeTypes.ELEMENT &&
              /[\r\n]/.test(node.content))
          ) {
            removedWhitespace = true // 移除空白
            nodes[i] = null as any // 删除此节点
          } else {
            // Otherwise, condensed consecutive whitespace inside the text
            // down to a single space
            // 如同一行内的两个元素之间的连续空白，如： template: '{{ foo }}   {{ bar }}'，两个插值节点间的空白
            node.content = ' '
          }
        } else {
          // 将文本内容中的连续空格替换成一个空格
          node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
        }
      }
      // also remove comment nodes in prod by default
      // 默认去掉生产环境下的注释节点
      if (
        !__DEV__ &&
        node.type === NodeTypes.COMMENT &&
        !context.options.comments
      ) {
        removedWhitespace = true
        nodes[i] = null as any // 删除节点
      }
    }
    if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
      // remove leading newline per html spec
      // https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
      const first = nodes[0]
      if (first && first.type === NodeTypes.TEXT) {
        // 去掉pre纯文本内容的首个换行，注意此时 pre元素里只有文本内容
        // 如：template: `<pre>
        //     abc</pre>`
        // 结果为: '<pre>   abc</pre>'
        first.content = first.content.replace(/^\r?\n/, '')
      }
    }
  }

  return removedWhitespace ? nodes.filter(Boolean) : nodes // 如果设置了移除空白选项（包括注释），则移除对应的节点
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes)
    // 处理 两个节点都是文本节点，将其拼接在一起，如 template: 'a < b'，虽然之前解析过程会对小于号 < 报错，但没有终止后续解析，因此需要处理并拼接在一起
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
 * 解析注释： <!--正常注释-->、处理无效注释 'a<!--bc'、不规范注释'<!-->'、处理嵌套注释'<!--<!--a-->123'、
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
 * 解析元素标签：标签名、标签属性、标签指令等
 */
function parseElement(
  context: ParserContext,
  ancestors: ElementNode[] // 祖先元素列表，每次解析完标签后，会存储进来
): ElementNode | undefined {
  __TEST__ && assert(/^<[a-z]/i.test(context.source))

  // 解析开始标签：标签名、标签属性列表、属性指令等
  const wasInPre = context.inPre // 记录祖先元素中是否有pre元素
  const wasInVPre = context.inVPre
  const parent = last(ancestors) // 获取父元素
  // 解析元素标签：指令等
  const element = parseTag(context, TagType.Start, parent)
  // 是否被 pre 标签包裹，在解析开始标签期间，如果是pre标签，则context.inPre会被设置为true
  const isPreBoundary = context.inPre && !wasInPre
  // 是否使用 v-pre 指令
  const isVPreBoundary = context.inVPre && !wasInVPre

  // 自闭元素 或自闭标签 <br />、<img />、<input /> 等：@vue/shared/src/domTagConfig.ts
  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }

  /**
   * 此时解析进度状态:
   * 如：template = '<span class="abc"></span>'，
   * 开始标签解析结果:
   *   element.loc: {
   *     source: "<span class="abc">"
   *     start: {column: 1, line: 1, offset: 0}
   *     end: {column: 19, line: 1, offset: 18}
   *   }
   * 接下来要解析的模版：context.source = '</span>'
   */

  // 解析子元素
  ancestors.push(element) // 存储父元素
  const mode = context.options.getTextMode(element, parent) // 获取元素文本类型，根据标签名
  // 开始解析子元素，返回子元素节点信息，如果是结束标签，则返回为空[]
  const children = parseChildren(context, mode, ancestors)
  ancestors.pop()
  // 解析完子元素

  element.children = children

  /**
   *  解析结束标签
   // 如：template = '<span class="abc"></span>'
   // 解析完开始标签了，此时：context.source = '</span>'
   */
  if (startsWithEndTagOpen(context.source, element.tag)) {
    // 判断开始标签是否带有对应的结束标签
    // 解析结束标签，比如不能有属性
    parseTag(context, TagType.End, parent)
  } else {
    // 如果没有对应的结束标签
    // 如：template = '<div><span class="abc"></span>'
    emitError(context, ErrorCodes.X_MISSING_END_TAG, 0, element.loc.start) // 缺少结束标签，并定位到开始标签位置
    if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
      // script 标签中，不能带有 html 的注释格式
      const first = children[0]
      if (first && startsWith(first.loc.source, '<!--')) {
        emitError(context, ErrorCodes.EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT)
      }
    }
  }

  element.loc = getSelection(context, element.loc.start)

  // 解析pre元素后，重置上下文的pre环境，在解析子元素时，若祖先元素有pre元素，不会重置inpre状态
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
  // 匹配标签名（开始标签或结束标签），以：空格、/、>、制页符 结束
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)! // 结尾 '!' ts语法 ，即match 排除 null
  // 捕获组1，括号内容：标签名 'span'
  const tag = match[1]
  // 默认 Namespaces.HTML
  const ns = context.options.getNamespace(tag, parent)

  // 解析标签名完成，继续移动光标距离，match[0] 为匹配到到内容，如: '<span'.length = 5
  advanceBy(context, match[0].length)
  // 跳过 开头为：空格、换行等，如：context.source = ' class="abc">'
  advanceSpaces(context)
  // 此时 context.source = 'class="abc">'

  // save current state in case we need to re-parse attributes with v-pre
  // 解析完标签名，保存此刻解析状态，光标位置，与当前解析内容，为了之后解析识别到标签为pre时，在解析完元素属性列表后，重置回此刻光标状态
  const cursor = getCursor(context)
  const currentSource = context.source

  // 解析标签属性，返回元素的属性节点列表，其中节点分为 普通html标签属性节点和指令属性节点
  let props = parseAttributes(context, type)
  // 至此 context.source = '' 或 '>...' 或 '/>...'

  // 判断 tag === 'pre'
  if (context.options.isPreTag(tag)) {
    context.inPre = true
  }

  // 检测节点属性列表中是否有 v-pre 指令
  if (
    !context.inVPre &&
    props.some(p => p.type === NodeTypes.DIRECTIVE && p.name === 'pre')
  ) {
    context.inVPre = true
    // reset context
    extend(context, cursor) // 重置光标信息到最开始标签属性开始位置，即标签名之后（也跳过空格）
    context.source = currentSource
    // 重新解析一遍元素属性列表，把所有属性都当作普通html标签属性，且不进行指令属性分析，同时去掉'v-pre' 属性
    props = parseAttributes(context, type).filter(p => p.name !== 'v-pre')
  }

  // 解析至此模版大致为： context.source = '' 或 '>...' 或 '/>...'，已经过 元素标签名、元素属性列表 分析

  // 解析标签的关闭标志，如: template:'<span class="abc"'，开始标签没有关闭
  let isSelfClosing = false
  if (context.source.length === 0) {
    // 标签没有关闭，没有闭合字符，
    emitError(context, ErrorCodes.EOF_IN_TAG)
  } else {
    // 自闭合标签，如：'<br />'
    isSelfClosing = startsWith(context.source, '/>')
    if (type === TagType.End && isSelfClosing) {
      // 结束标签 不该为自闭合
      emitError(context, ErrorCodes.END_TAG_WITH_TRAILING_SOLIDUS)
    }
    // 跳过关闭字符
    advanceBy(context, isSelfClosing ? 2 : 1)
  }
  // 至此标签的模版光标解析结束

  /**
   * 非用户自定义元素时，需要判断元素标签类型： ELEMENT、 COMPONENT、 SLOT、 TEMPLATE
   * 默认都是 ELEMENT
   */
  let tagType = ElementTypes.ELEMENT
  const options = context.options
  if (!context.inVPre && !options.isCustomElement(tag)) {
    // 非用户自定义元素： NO = () => false
    // 判断是 v-is 指令，动态组件
    const hasVIs = props.some(
      p => p.type === NodeTypes.DIRECTIVE && p.name === 'is'
    )

    // 判断是组件元素
    if (options.isNativeTag && !hasVIs) {
      if (!options.isNativeTag(tag)) tagType = ElementTypes.COMPONENT // 如果不是html 标签，则判定为组件
    } else if (
      hasVIs ||
      isCoreComponent(tag) || // 内置组件：Teleport、Suspense、KeepAlive、BaseTransition  (可以大小写横线)
      (options.isBuiltInComponent && options.isBuiltInComponent(tag)) || // 内置组件 Transition、TransitionGroup
      /^[A-Z]/.test(tag) || // 大写标签默认被识别为组件
      tag === 'component'
    ) {
      tagType = ElementTypes.COMPONENT
    }

    if (tag === 'slot') {
      tagType = ElementTypes.SLOT // 元素类型 为slot
    } else if (
      tag === 'template' &&
      props.some(p => {
        return (
          p.type === NodeTypes.DIRECTIVE && isSpecialTemplateDirective(p.name) // 存在指定指令列表则 元素为template类型
        )
      })
    ) {
      tagType = ElementTypes.TEMPLATE // 元素类型为模版template，且必须带有指定指令列表
    }
  }

  // 返回元素模版节点信息
  return {
    type: NodeTypes.ELEMENT,
    ns, // 命名空间
    tag, // 标签名
    tagType, // 标签类型：ELEMENT、 COMPONENT、 SLOT、 TEMPLATE
    props, // 元素属性列表
    isSelfClosing, // 标签是否自闭和
    children: [],
    loc: getSelection(context, start), // 元素标签位置信息，如：template='<span class="abc"></span>'，完成解析开始标签后，其中的 loc.source = '<span class="abc">'
    codegenNode: undefined // to be created during transform phase  在 transform 阶段进行赋值
  }
}

/**
 * 解析标签上的属性列表: 属性名tagName=属性值tagValue，还有属性指令，以 v-、:、@、# 开头
 * 返回元素的属性节点列表，其中节点分为 普通html标签属性节点和指令属性节点
 */
function parseAttributes(
  context: ParserContext,
  type: TagType // 开始标签或结束标签
): (AttributeNode | DirectiveNode)[] {
  const props = []
  const attributeNames = new Set<string>()

  // 以 context.source = '' 或 '>...' 或 '/>...' 为结束解析标签属性
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    if (startsWith(context.source, '/')) {
      // 标签属性上不能有：'/'，如：template = '<span / class="abc"></span>'，此时 context.source = '/ class="abc"></span>'
      emitError(context, ErrorCodes.UNEXPECTED_SOLIDUS_IN_TAG)
      advanceBy(context, 1)
      advanceSpaces(context)
      continue // 当前为无效属性，无需记录，直接继续解析后边属性
    }

    if (type === TagType.End) {
      // 结束标签上不能有属性，如: template = '</span class="abc">'
      emitError(context, ErrorCodes.END_TAG_WITH_ATTRIBUTES)
    }

    // 解析标签每个属性，返回html普通元素属性节点 或 指令属性节点
    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      props.push(attr)
    }

    // 如：template: '<span name="hello"class="world"></span>'，解析完name属性时，光标定位到name属性值后边，如果发现当前位置不是空格或结束边界则报错
    if (/^[^\t\r\n\f />]/.test(context.source)) {
      emitError(context, ErrorCodes.MISSING_WHITESPACE_BETWEEN_ATTRIBUTES)
    }
    // 跳过空格，继续下一个属性解析，如果此时 context.source = '' 或 '>...' 或 '/>...' 则结束解析元素属性
    advanceSpaces(context)
  }

  return props // 返回元素属性节点列表
}

/**
 * 解析标签上的属性: 属性名tagName=属性值tagValue，还有属性指令:/^(v-|:|@|#)/.test(tagName)
 * 返回 指令属性节点 或 普通html元素属性节点
 */
function parseAttribute(
  context: ParserContext,
  nameSet: Set<string> // 元素标签属性列表集合
): AttributeNode | DirectiveNode {
  __TEST__ && assert(/^[^\t\r\n\f />]/.test(context.source))

  // 解析属性名，如：context.source = 'class="abc" :hello="123"></span>'
  const start = getCursor(context) // 记录当前光标解析位置
  // 匹配属性名，不能以：'空格、/、>' 开头， 且之后以：'空格、换行、/、>、=' 为结束边界
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  // match[0] 为 匹配到的内容: 'class'、':hello'
  const name = match[0]

  // 校验属性名

  // 属性名 不能重复
  if (nameSet.has(name)) {
    emitError(context, ErrorCodes.DUPLICATE_ATTRIBUTE)
  }
  nameSet.add(name)
  if (name[0] === '=') {
    // 属性名 不能以 '=' 开头，如：'<span =class="abc"></span>'，则 name = '=class'
    emitError(context, ErrorCodes.UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME)
  }
  // 在一个块级域中处理
  {
    // 属性名不能含有以下字符
    const pattern = /["'<]/g
    let m: RegExpExecArray | null
    while ((m = pattern.exec(name))) {
      // 如：<span cl"as's<="abc">，则 name = `cla"as's<`
      // 如：没有关闭标签 template= '<span class="abc" </span>'，则第二次解析属性时 name = '<'
      // 如：动态指令 @['click'].prevent="handleClick"
      emitError(
        context,
        ErrorCodes.UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME,
        m.index // 匹配到的错误位置，如：name = `cla"as's<`，m.index = 3
      )
    }
  }

  // 完成解析：属性名，前进解析光标、模版中移除解析名
  advanceBy(context, name.length)

  // 注意：在html 文档中，<div id="app"><span v-model></span></div>，通过innerHTML，获取模版信息时，属性默认值为""，即得到的template = document.querySelector('#app').innerHTML = '<span v-model=""></span>'
  // 与在组件上直接定义属性 template: '<span v-model></span>' 不同

  // 开始解析：属性值
  // 属性值在 '=' 之后，如：template: '<span class = "abc">'，此时 context.source: ' = "abc">'，注意可以 空格、换行 间隔
  let value: AttributeValue = undefined

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context) // 跳过空格
    advanceBy(context, 1) // 跳过 '='
    advanceSpaces(context) // 跳过空格
    // 解析属性值，并返回属性值节点
    // 属性值 可以设置引号，template: '<span class = "abc">'
    // 也可以没有，template: '<span class = abc>'，如果开始没有引号，则其结束边界为：空格、>，同时属性值内容不能有：引号、空格、<
    // 结果都是：class="abc"
    value = parseAttributeValue(context) // 返回属性值节点

    // 判断节点是否存在
    // 有 '=' 时，必须设置属性值节点，如: template = '<span class = ></span>'，context.source = '></span>'，注意，class=""
    if (!value) {
      emitError(context, ErrorCodes.MISSING_ATTRIBUTE_VALUE)
    }
  }
  // 记录 所解析属性名与属性值 的位置，范围从属性名开始到属性值结束，此时光标移动到属性值之后
  const loc = getSelection(context, start)

  // 解析完成：属性值

  // 解析标签指令，判断属性名是否代表指令
  // 如：template = '<span v-bind:["指令参数(如click或change)"].prevent="someHandler"></span>'
  // 此时: name = 'v-bind:["指令参数(如click或change)"].prevent'

  // 指令开头必须是：v-、:、@、#
  // context.inVPre 即指令列表存在v-pre指令，则不需要解析（触发时机：当解析完所有指令之后，会判断指令列表中是否有v-pre指令，有则会重新解析一遍所有属性，且把指令属性当做普通html标签属性处理）
  if (!context.inVPre && /^(v-|:|@|#)/.test(name)) {
    // 指令分类：v-xxx指令、v-xxx:xxx指令、 :[xxx]（参数形式的指令）、:xxx指令
    // 还有：@[xxx]指令、@xxx指令、#[xxx]、#xxx
    // 注意 ':'、 '@'、'#' 后边 不能马上跟 '.'，如：'<span @.click="someHandler"></span>'，此时 match[2] = undefined，match[3] = '@.click'，即只符合 (.+)?
    // 如： template = '<span v-if="true"></span>'，则 name = 'v-if'
    // 如： template = '<span :attr1='true' @[attr2]="false"></span>'，则 name = 'v-if'
    // '?:' 表示不进行捕获这个括号中内容
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
      name
    )! // 排除 null

    /**
     * 如属性名name为： 'v-bind:["指令参数(如click或change)"].prevent'  或者 '#header' 或 '@click'
     *    match[1] 为匹配第一个待捕获的括号内容：([a-z0-9-]+) 指令，则 match[1] = 'bind' 或 '' 或 ''
     *    match[2] 为匹配第二个待捕获的括号内容：(\[[^\]]+\]|[^\.]+)，则 match[2] = '["指令参数(如click或change)"]' 或 'header' 或 'click'
     *    match[3] 为匹配第三个待捕获的括号内容：(.+)，则 match[3] = '.prevent'
     * 注意 '?:' 表示不进行捕获这个括号中内容
     */
    /**
     * 解析指令别名对应的真实功能：
     *    如果 存在 v-xxx，则直接设置为 'xxx'，如v-slot，则 dirName = 'slot'
     *    否则：
     *        ':' 开头代表 'bind'
     *        '@' 开头代表 'on'
     *        '#' 开头代表 'slot'，此为默认，如：template: '<span #header="nav"></span>'，则 dirName = 'slot'
     */
    const dirName =
      match[1] ||
      (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot')

    // 指令属性名节点/指令名表达式，match[2]，如 @click.prevent 中的 'click'；
    // 注意 动态指令时，不能是 @['click']，指令名不可以有 ' " < 这3个字符，必须是个变量
    let arg: ExpressionNode | undefined

    // match[2] 捕获 (?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+)) 其中括号内容：(\[[^\]]+\]|[^\.]+) ，即跟在 :、@、# 后的内容
    // 如 <span v-bind="{}"></span> 则此时 match2 = undefined
    if (match[2]) {
      const isSlot = dirName === 'slot' // 如：template: '<span #header="nav"></span>' 或 'v-slot'，则 name = '#header'，match[2] = 'header'，dirName = 'slot'
      const startOffset = name.indexOf(match[2]) // 指令内容开始位置

      // 解析指令内容的开始位置与结束位置，解析的内容为  ' :、@、# ' 后的指令内容
      const loc = getSelection(
        // 获取指定模板范围内的位置与内容
        context,
        // 由于已解析完属性名跟属性值，模版光标已经移动到属性值之后，所以需要通过getNewPosition方法去单独获取指令在模版中的位置信息
        getNewPosition(context, start, startOffset), // 如 'v-bind:click' 则返回指令名 'click' 光标模版开始位置节点，功能等同与 advance 中的 advancePositionWithMutation 移动光标功能，但getNewPosition方法不影响 start 光标位置信息，advancePositionWithMutation 则影响光标位置信息
        getNewPosition(
          // 返回指令内容在模版中的结束位置信息
          context,
          start, // 指令内容开始位置
          startOffset + match[2].length + ((isSlot && match[3]) || '').length // 如果是slot的话，还要包括 match[3]，为了支持vue2.x，如v-slot:header.top
        )
      )
      let content = match[2]
      let isStatic = true // 是否静态指令

      // 动态指令 '@[someEvent]'，其中变量someEvent: 'click'
      if (content.startsWith('[')) {
        isStatic = false

        if (!content.endsWith(']')) {
          emitError(
            context,
            ErrorCodes.X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END
          )
        }

        // 去掉双括号： [ 和 ]
        content = content.substr(1, content.length - 2)
      } else if (isSlot) {
        // #1241 special case for v-slot: vuetify relies extensively on slot
        // names containing dots. v-slot doesn't have any modifiers and Vue 2.x
        // supports such usage so we are keeping it consistent with 2.x.
        // 为了支持vue2.x，slot 指令 要包括 '.' 之后的内容
        content += match[3] || ''
      }

      // 指令参数节点
      // 返回指令名内容信息，如 v-slot:default 中的 'default'，:is 中的 'is'
      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION, // 节点类型为表达式
        content,
        isStatic, // 静态/动态指令，在transform element 中查找组件 is指令判断是否静态时，会用到
        constType: isStatic
          ? ConstantTypes.CAN_STRINGIFY
          : ConstantTypes.NOT_CONSTANT,
        loc // 属性名中指令内容 的开始位置与结束位置还有对应的模版内容，如：'@click'属性的指令内容即： 'click'字符串在解析模版中的位置信息
      }
    }

    // 调整属性值 loc 位置信息，去掉引号
    if (value && value.isQuoted) {
      const valueLoc = value.loc // 属性值 loc光标位置信息，注意 loc包含引号，但 value.content 是不包含引号，只有内容
      valueLoc.start.offset++
      valueLoc.start.column++
      valueLoc.end = advancePositionWithClone(valueLoc.start, value.content) // 调整结束位置，不影响开始位置
      valueLoc.source = valueLoc.source.slice(1, -1) // 调整loc 中的source，去掉引号
    }

    // 返回指令属性节点
    return {
      type: NodeTypes.DIRECTIVE, // 节点类型为指令类型
      name: dirName, // 指令类别，如 if、show、或 bind、on、slot等指令名
      exp: value && {
        // 指令值表达式节点
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content, // 指令属性值
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // other values by `transformExpression` to make it eligible for hoisting.
        constType: ConstantTypes.NOT_CONSTANT,
        loc: value.loc
      },
      arg, // 指令表达式名内容信息，注意必须是个变量 @['click'] 不符合语法，指令名不能包含 ' " <
      modifiers: match[3] ? match[3].substr(1).split('.') : [], // 指令的修饰符列表 '@click.prevent.once'中的 'prevent'、'once'
      loc // 指令属性位置，包括属性名与属性值
    }
  }

  // 返回普通html元素 attr属性 信息
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc
    },
    loc // 属性位置
  }
}

/**
 * 解析属性值（属性值在 '=' 之后），并返回属性值内容节点、移动光标
 * 返回值： content 不包括引号、loc 包括引号
 */
function parseAttributeValue(context: ParserContext): AttributeValue {
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
      // 缺少结束引号， 如：template = '<span class = "abc></span>'，则属性值内容为: content = 'abc></span>'
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
    // 属性值没有引号包裹，则以：'空格、换行、>' 为结束边界
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

  // 返回属性值内容节点信息，其中 loc 包括引号位置信息
  return { content, isQuoted, loc: getSelection(context, start) }
}

/**
 * 解析插值 {{ }}
 * @param context
 * @param mode
 */
function parseInterpolation(
  context: ParserContext,
  mode: TextModes
): InterpolationNode | undefined {
  const [open, close] = context.options.delimiters // ['{{', '}}']
  __TEST__ && assert(startsWith(context.source, open))

  // 查找结束边界位置
  const closeIndex = context.source.indexOf(close, open.length)
  if (closeIndex === -1) {
    // 无效解析
    emitError(context, ErrorCodes.X_MISSING_INTERPOLATION_END)
    return undefined
  }

  const start = getCursor(context)
  advanceBy(context, open.length) // 前进光标，跳过 '{{'
  const innerStart = getCursor(context) // 获取插值内容开始位置
  const innerEnd = getCursor(context)
  const rawContentLength = closeIndex - open.length // 内容长度
  const rawContent = context.source.slice(0, rawContentLength) //插值初始内容

  const preTrimContent = parseTextData(context, rawContentLength, mode)
  // 去掉插值内容两端空白，得到具体插值内容
  const content = preTrimContent.trim()
  // 插值内容开始位置
  const startOffset = preTrimContent.indexOf(content)
  if (startOffset > 0) {
    // template: '{{ abc }}'，preTrimContent = ' abc '，content = 'abc'，startOffset = 1
    advancePositionWithMutation(innerStart, rawContent, startOffset) // 如果插值开始位置存在空格，则改变 innerStart 光标信息，调整到具体插值内容开始位置
  }
  // 内容结束位置
  const endOffset =
    rawContentLength - (preTrimContent.length - content.length - startOffset)

  // 调整结束位置对应的光标信息
  advancePositionWithMutation(innerEnd, rawContent, endOffset)

  advanceBy(context, close.length) // 前进光标，跳过 '}}'

  return {
    type: NodeTypes.INTERPOLATION, // 插值类型
    content: {
      // 插值内容节点
      type: NodeTypes.SIMPLE_EXPRESSION, // 一个简单的表达式类型节点（此表达式基础 由 ./ast.ts/createSimpleExpression创建，在后续会常见）
      isStatic: false,
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: ConstantTypes.NOT_CONSTANT, // transformText 会用到
      content,
      loc: getSelection(context, innerStart, innerEnd) // 记录具体插值内容在模版中的位置信息
    },
    loc: getSelection(context, start) // 记录插值节点的位置信息
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
 * 解析文本内容并返回、移动光标
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
    // 解析普通文本 且带有 &符号，可能是html 实体，如 在html dom文档body中使用小于号 <，在通过 innerHTML获取模版内容时，会被转译为 &lt; 。因此解析时为了获取实际的内容，需要decodeEntities解析实体内容
    // 通过创建一个dom实例，将rawText作为innerHTML，然后获取其中的textContent，即可实现解析
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
    source: context.originalSource.slice(start.offset, end.offset) // 节点内容即该节点对应的模板内容，slice()返回从开始索引到结束索引对应的所有元素，其 中不包含结束索引对应的元素
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

/**
 * 针对标签属性名为指令的属性节点，获取指令对应的开始/结束 光标位置信息，不影响属性名节点开始位置start: Position
 */
function getNewPosition(
  context: ParserContext,
  start: Position, // 属性名指令光标开始位置
  numberOfCharacters: number
): Position {
  return advancePositionWithClone(
    // 不修改 start 位置信息 （注意，在advancePositionWithMutation则影响模版节点位置信息）
    start,
    context.originalSource.slice(start.offset, numberOfCharacters), // 返回指令前缀，如 'v-bind:click'，则前缀为 'v-bind:'，再如：'#header'，则前缀为 '#'
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

// 判断当前解析内容是否是结束边界
function isEnd(
  context: ParserContext,
  mode: TextModes,
  ancestors: ElementNode[]
): boolean {
  /**
   * 如 template: '<span class="abc"></span>'
   * 当解析完开始标签后，此时 context.source = '</span>'
   */

  const s = context.source

  switch (mode) {
    case TextModes.DATA: // 元素默认为DATA
      if (startsWith(s, '</')) {
        //TODO: probably bad performance
        for (let i = ancestors.length - 1; i >= 0; --i) {
          // 判断是否是某一个开始标签对应的结束标签
          // s='</span>', ancestors[0].tag = 'span'
          if (startsWithEndTagOpen(s, ancestors[i].tag)) {
            return true
          }
        }
      }
      break

    // 以下内容也不需要进行解析
    case TextModes.RCDATA: // 富文本框textarea 或 文档标题title标签
    case TextModes.RAWTEXT: {
      // 纯文本标签：style,iframe,script,noscript
      // 如 RCDATA: template='<textarea class="abc"></textarea>'
      const parent = last(ancestors)
      if (parent && startsWithEndTagOpen(s, parent.tag)) {
        return true
      }
      break
    }

    case TextModes.CDATA: // xhtml/xml
      if (startsWith(s, ']]>')) {
        return true
      }
      break
  }

  return !s
}

/**
 * 判断开始标签带有对应的结束标签
 * 即判断当前结束标签是否是其开始标签对应的结束标签
 */
function startsWithEndTagOpen(source: string, tag: string): boolean {
  //  // source='</span>', tag = 'span'
  return (
    startsWith(source, '</') && // 结束标签 标志
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() && // 结束标签名 与开始标签名一致
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>') // 判断结束标签 最后一个字符，必须关闭
  )
}
