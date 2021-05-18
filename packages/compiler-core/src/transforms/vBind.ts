import { DirectiveTransform } from '../transform'
import { createObjectProperty, createSimpleExpression, NodeTypes } from '../ast'
import { createCompilerError, ErrorCodes } from '../errors'
import { camelize } from '@vue/shared'
import { CAMELIZE } from '../runtimeHelpers'

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
  // 指令值、修饰符、模版位置信息
  const { exp, modifiers, loc } = dir
  const arg = dir.arg! // 指令参数节点， ts 排除null/undefined

  // 属性名 内容处理

  // ast 默认生成 NodeTypes.SIMPLE_EXPRESSION
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

  if (
    !exp || // 属性值不存在
    (exp.type === NodeTypes.SIMPLE_EXPRESSION && !exp.content.trim()) // 属性值为空白
  ) {
    context.onError(createCompilerError(ErrorCodes.X_V_BIND_NO_EXPRESSION, loc)) // 需要设置属性值
    return {
      props: [createObjectProperty(arg!, createSimpleExpression('', true, loc))] // 临时创建节点，属性值内容为空
    }
  }

  return {
    props: [createObjectProperty(arg!, exp)] // 返回转换后的属性列表
  }
}
