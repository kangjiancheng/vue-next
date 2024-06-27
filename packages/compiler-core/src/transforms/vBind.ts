import type { DirectiveTransform, TransformContext } from '../transform'
import {
  type DirectiveNode,
  type ExpressionNode,
  NodeTypes,
  type SimpleExpressionNode,
  createObjectProperty,
  createSimpleExpression,
} from '../ast'
import { ErrorCodes, createCompilerError } from '../errors'
import { camelize } from '@vue/shared'
import { CAMELIZE } from '../runtimeHelpers'
import { processExpression } from './transformExpression'

// v-bind without arg is handled directly in ./transformElements.ts due to it affecting
// codegen for the entire props object. This transform here is only for v-bind
// *with* args.
/**
 * 处理 v-bind 指令，该transform 处理的v-bind 带有指令参数，如：v-bind:class="{...}"
 * 不带参数的v-bind 在transformElements中处理，与v-on一起，如：v-bind="{class: '...'}"
 * @param dir - v-bind 指令属性节点
 * @param node - dom元素 或 组件元素
 * @param context
 */
export const transformBind: DirectiveTransform = (dir, _node, context) => {
  // 修饰符、模版位置信息
  const { modifiers, loc } = dir
  const arg = dir.arg! // 指令参数节点， ts 排除null/undefined
  // 指令值、
  let { exp } = dir

  // 属性名 内容处理

  // ast 默认生成 NodeTypes.SIMPLE_EXPRESSION

  // handle empty expression
  if (exp && exp.type === NodeTypes.SIMPLE_EXPRESSION && !exp.content.trim()) {
    if (!__BROWSER__) {
      // #10280 only error against empty expression in non-browser build
      // because :foo in in-DOM templates will be parsed into :foo="" by the
      // browser
      context.onError(
        createCompilerError(ErrorCodes.X_V_BIND_NO_EXPRESSION, loc),
      )
      return {
        props: [
          createObjectProperty(arg, createSimpleExpression('', true, loc)),
        ],
      }
    } else {
      exp = undefined
    }
  }

  // same-name shorthand - :arg is expanded to :arg="arg"
  if (!exp) {
    if (arg.type !== NodeTypes.SIMPLE_EXPRESSION || !arg.isStatic) {
      // only simple expression is allowed for same-name shorthand
      context.onError(
        createCompilerError(
          ErrorCodes.X_V_BIND_INVALID_SAME_NAME_ARGUMENT,
          arg.loc,
        ),
      )
      return {
        props: [
          createObjectProperty(arg, createSimpleExpression('', true, loc)),
        ],
      }
    }

    transformBindShorthand(dir, context)
    exp = dir.exp!
  }

  if (arg.type !== NodeTypes.SIMPLE_EXPRESSION) {
    arg.children.unshift(`(`)
    arg.children.push(`) || ""`)
  } else if (!arg.isStatic) {
    // 动态指令
    // 如 <button :[propName]='...'></button>，如 propName='data-xxx'，转换为 arg.content='propName || ""'
    arg.content = `${arg.content} || ""` // 属性名表达参数
  }

  // 修饰符 格式小驼峰

  // .prop is no longer necessary due to new patch behavior
  // .sync is replaced by v-model:arg
  if (modifiers.includes('camel')) {
    // transform the kebab-case attribute name into camelCase
    if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
      if (arg.isStatic) {
        // 静态指令，将指令名从kebab-case转换camelCase小驼峰，如 '<span :prop-name.camel="123"></span>'，则 arg.content='prop-name' 转换为 arg.content='propName'
        arg.content = camelize(arg.content)
      } else {
        // 动态指令，如 '<span :[prop-name].camel="123"></span>'，则 arg.content='prop-name || ""'，转换为arg.content=`Symbol('camelize')(prop-name || "")`
        arg.content = `${context.helperString(CAMELIZE)}(${arg.content})`
      }
    } else {
      arg.children.unshift(`${context.helperString(CAMELIZE)}(`)
      arg.children.push(`)`)
    }
  }

  // 属性值 校验
  if (!context.inSSR) {
    if (modifiers.includes('prop')) {
      injectPrefix(arg, '.')
    }
    if (modifiers.includes('attr')) {
      injectPrefix(arg, '^')
    }
  }

  return {
    props: [createObjectProperty(arg, exp)], // 返回转换后的属性列表
  }
}

export const transformBindShorthand = (
  dir: DirectiveNode,
  context: TransformContext,
) => {
  const arg = dir.arg!

  const propName = camelize((arg as SimpleExpressionNode).content)
  dir.exp = createSimpleExpression(propName, false, arg.loc)
  if (!__BROWSER__) {
    dir.exp = processExpression(dir.exp, context)
  }
}

const injectPrefix = (arg: ExpressionNode, prefix: string) => {
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      arg.content = prefix + arg.content
    } else {
      arg.content = `\`${prefix}\${${arg.content}}\``
    }
  } else {
    arg.children.unshift(`'${prefix}' + (`)
    arg.children.push(`)`)
  }
}
