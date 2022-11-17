import { SimpleExpressionNode } from './ast'
import { TransformContext } from './transform'
import { createCompilerError, ErrorCodes } from './errors'

// these keywords should not appear inside expressions, but operators like
// 'typeof', 'instanceof', and 'in' are allowed
const prohibitedKeywordRE = new RegExp(
  '\\b' +
    (
      'arguments,await,break,case,catch,class,const,continue,debugger,default,' +
      'delete,do,else,export,extends,finally,for,function,if,import,let,new,' +
      'return,super,switch,throw,try,var,void,while,with,yield'
    )
      .split(',')
      .join('\\b|\\b') +
    '\\b'
)

// strip strings in expressions
const stripStringRE =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g

/**
 * 校验在浏览器环境下，表达式值的js语法是否规范：指令值表达式、动态指令参数表达式、插值表达式等
 *
 * Validate a non-prefixed expression.
 * This is only called when using the in-browser runtime compiler since it
 * doesn't prefix expressions.
 */
export function validateBrowserExpression(
  node: SimpleExpressionNode, // 如 v-on 的指令属性值 节点 或 v-for="item in [item1, item2]" v-for 中in/of的右侧遍历对象节点 '[item1, item2]'
  context: TransformContext,
  asParams = false, // 校验表达式语法方式：作为函数参数或函数体，将表达式放在函数参数位置还是函数体位置
  asRawStatements = false // 是否作为原始的js语句，即不用return，如 '<button @click="count++; total-"></button>'
) {
  const exp = node.content // 指令值内容

  // empty expressions are validated per-directive since some directives
  // do allow empty expressions.
  if (!exp.trim()) {
    return
  }

  try {
    // 创建一个函数，最后一个参数为函数体，前边为函数参数
    new Function(
      asRawStatements // 如 v-on中存在分隔符 ';' 或 多行执行语句
        ? ` ${exp} ` // 如  <button @click="if (count > 1) count++; "></button> ，则exp='if (count > 1) count++;'，结果为 (function anonymous ) { if (count > 1) count++; })
        : `return ${asParams ? `(${exp}) => {}` : `(${exp})`}` // 如 '<button @click="count++"></button>'， exp = node.content='count++' 转换后为 (function anonymous() { return (count++) })
    )
    // 注意
  } catch (e: any) {
    let message = e.message
    const keywordMatch = exp
      .replace(stripStringRE, '')
      .match(prohibitedKeywordRE)
    if (keywordMatch) {
      // 如  <button @click="if (count > 1) count++ "></button>， 在上方 new Function() 时，会接在 return 关键字之后
      message = `avoid using JavaScript keyword as property name: "${keywordMatch[0]}"`
    }
    context.onError(
      createCompilerError(
        ErrorCodes.X_INVALID_EXPRESSION, // on/if/for 指令的属性值为不合理的js语句
        node.loc,
        undefined,
        message
      )
    )
  }
}
