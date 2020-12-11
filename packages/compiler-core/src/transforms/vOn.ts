import { DirectiveTransform, DirectiveTransformResult } from '../transform'
import {
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
  DirectiveNode,
  ElementTypes,
  ExpressionNode,
  NodeTypes,
  SimpleExpressionNode
} from '../ast'
import { camelize, toHandlerKey } from '@vue/shared'
import { createCompilerError, ErrorCodes } from '../errors'
import { processExpression } from './transformExpression'
import { validateBrowserExpression } from '../validateExpression'
import { hasScopeRef, isMemberExpression } from '../utils'
import { TO_HANDLER_KEY } from '../runtimeHelpers'

// \w 匹配字母、数字、下划线。等价于'[A-Za-z0-9_]'。
// \W 匹配非字母、数字、下划线。等价于 '[^A-Za-z0-9_]'。
// \s 匹配任何空白字符，包括空格、制表符、换页符等等。等价于 [ \f\n\r\t\v]。
// \S 匹配任何非空白字符。等价于 [^ \f\n\r\t\v]。

// 匹配函数语句结构
// 'param => '  或 '(param1, param2) => '
// 或 'function foo ('
const fnExpRE = /^\s*([\w$_]+|\([^)]*?\))\s*=>|^\s*function(?:\s+[\w$]+)?\s*\(/

export interface VOnDirectiveNode extends DirectiveNode {
  // v-on without arg is handled directly in ./transformElements.ts due to it affecting
  // codegen for the entire props object. This transform here is only for v-on
  // *with* args.
  arg: ExpressionNode
  // exp is guaranteed to be a simple expression here because v-on w/ arg is
  // skipped by transformExpression as a special case.
  exp: SimpleExpressionNode | undefined
}

export const transformOn: DirectiveTransform = (
  dir, // 指令属性节点
  node, // dom元素节点或组件节点
  context, // transform 上下文
  augmentor
) => {
  // 如 template: '<button @click.stop.prevent="handleClick"></button>'
  // modifiers: ['stop', 'prevent']
  // arg 指令名参数节点： click
  const { loc, modifiers, arg } = dir as VOnDirectiveNode
  if (!dir.exp && !modifiers.length) {
    context.onError(createCompilerError(ErrorCodes.X_V_ON_NO_EXPRESSION, loc)) // 没有指令值
  }
  /**
   * 处理指令属性名，不处理修饰符modifiers，在 augmentor 中处理
   */
  let eventName: ExpressionNode
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      // 静态指令，如 '<button @click="handleClick"></button>'
      const rawName = arg.content // 指令名内容：'click'
      // for all event listeners, auto convert it to camelCase. See issue #2249
      // 创建指令名 对应的简单表达式节点
      // 如：eventName.content = 'onClick'
      eventName = createSimpleExpression(
        toHandlerKey(camelize(rawName)), // 将 kebeb-base 转换为 camelCase， 并添加事件前缀 on，同时大写第一个字母
        true,
        arg.loc
      )
    } else {
      // #2388
      // 动态指令，如 '<button @[eventName]="handleClick"></button>'，其中变量eventName='click'

      // 复合表达式节点
      eventName = createCompoundExpression([
        // ['_toHandlerKey(', arg, ')']
        `${context.helperString(TO_HANDLER_KEY)}(`,
        arg,
        `)`
      ])
    }
  } else {
    // already a compound expression.
    // 已经转换为 compound expression 复合表达式节点
    eventName = arg
    eventName.children.unshift(`${context.helperString(TO_HANDLER_KEY)}(`)
    eventName.children.push(`)`)
  }

  // handler processing
  /**
   * 处理指令属性值节点
   */
  let exp: ExpressionNode | undefined = dir.exp as  // 指令值
    | SimpleExpressionNode
    | undefined
  if (exp && !exp.content.trim()) {
    exp = undefined
  }
  // 是否要缓存指令，不需要重新解析，加快vnode
  let shouldCache: boolean = context.cacheHandlers && !exp
  if (exp) {
    // 验证是否是有效的函数名调用方式
    // 匹配一个指令属性值的表达式： 以 [A-Za-z_$] 开头，如 <button @keyup="handleKeyup" @click="$_abc[foo][bar]" @change="abc  . foo . (可以换行)  bar"></button>
    const isMemberExp = isMemberExpression(exp.content)

    // 验证是行内声明执行表达式，即非函数声明：不是函数名赋值也不是函数定义
    // 如： <button @click="count ++; total --" @change="handleChange()">{{ count }}</button>
    const isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content))

    // 明确表达式结束符（多行代码）
    // 如 <button @click="count++ ;" @click="count ++; total--" @click="if ( count>1 ) count++;></button>
    // 注意如果出现js关键字，则必须加上分隔符 ';'， 因为之后会validateBrowserExpression通过new Function() 验证此表达式符合js语法
    const hasMultipleStatements = exp.content.includes(`;`)

    // TODO: analyze cfs
    // process the expression since it's been skipped
    if (!__BROWSER__ && context.prefixIdentifiers) {
      isInlineStatement && context.addIdentifiers(`$event`)
      exp = dir.exp = processExpression(
        exp,
        context,
        false,
        hasMultipleStatements
      )
      isInlineStatement && context.removeIdentifiers(`$event`)
      // with scope analysis, the function is hoistable if it has no reference
      // to scope variables.
      shouldCache =
        context.cacheHandlers &&
        // runtime constants don't need to be cached
        // (this is analyzed by compileScript in SFC <script setup>)
        !(exp.type === NodeTypes.SIMPLE_EXPRESSION && exp.constType > 0) &&
        // #1541 bail if this is a member exp handler passed to a component -
        // we need to use the original function to preserve arity,
        // e.g. <transition> relies on checking cb.length to determine
        // transition end handling. Inline function is ok since its arity
        // is preserved even when cached.
        !(isMemberExp && node.tagType === ElementTypes.COMPONENT) &&
        // bail if the function references closure variables (v-for, v-slot)
        // it must be passed fresh to avoid stale values.
        !hasScopeRef(exp, context.identifiers)
      // If the expression is optimizable and is a member expression pointing
      // to a function, turn it into invocation (and wrap in an arrow function
      // below) so that it always accesses the latest value when called - thus
      // avoiding the need to be patched.
      if (shouldCache && isMemberExp) {
        if (exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          exp.content = `${exp.content} && ${exp.content}(...args)`
        } else {
          exp.children = [...exp.children, ` && `, ...exp.children, `(...args)`]
        }
      }
    }

    if (__DEV__ && __BROWSER__) {
      // 验证指令值表达式是否符合js语法规范
      validateBrowserExpression(
        exp as SimpleExpressionNode,
        context,
        false,
        hasMultipleStatements
      )
    }

    // 行内可执行的js语句 ，包装成函数格式
    if (isInlineStatement || (shouldCache && isMemberExp)) {
      // wrap inline statement in a function expression
      // 将行内语句转换为等价的函数结构语句
      // 如： <button @click="count ++; foo --">{{ count }}</button> 转换为 ['$event => {', exp, '}']
      // 如： <button @click="obj.handleClick"></button> 转换为 ['(...args) => (', exp, ')']

      // 创建codegen复合表达式节点
      exp = createCompoundExpression([
        `${
          isInlineStatement
            ? !__BROWSER__ && context.isTS // TODO: analyze cfs
              ? `($event: any)`
              : `$event` // 行内表达式
            : `${
                !__BROWSER__ && context.isTS ? `\n//@ts-ignore\n` : ``
              }(...args)` // 函数
        } => ${hasMultipleStatements ? `{` : `(`}`,
        exp,
        hasMultipleStatements ? `}` : `)`
      ])
    }
  }

  let ret: DirectiveTransformResult = {
    props: [
      // 创建指令属性对应的js属性表达式节点
      createObjectProperty(
        eventName, // codegen指令属性名节点
        exp || createSimpleExpression(`() => {}`, false, loc) // codegen指令属性值节点
      )
    ]
  }

  // apply extended compiler augmentor
  // 扩展解析，如 由 compiler-dom 的transformOn 解析modifiers修饰符
  if (augmentor) {
    ret = augmentor(ret)
  }

  if (shouldCache) {
    // cache handlers so that it's always the same handler being passed down.
    // this avoids unnecessary re-renders when users use inline handlers on
    // components.
    // 缓存解析，避免渲染时，重复解析
    ret.props[0].value = context.cache(ret.props[0].value)
  }

  return ret
}
