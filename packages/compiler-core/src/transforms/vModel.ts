import type { DirectiveTransform } from '../transform'
import {
  ConstantTypes,
  ElementTypes,
  type ExpressionNode,
  NodeTypes,
  type Property,
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
} from '../ast'
import { ErrorCodes, createCompilerError } from '../errors'
import {
  hasScopeRef,
  isMemberExpression,
  isSimpleIdentifier,
  isStaticExp,
} from '../utils'
import { IS_REF } from '../runtimeHelpers'
import { BindingTypes } from '../options'
import { camelize } from '@vue/shared'

/**
 * 转换处理 v-model 指令
 * @param dir - v-model 指令属性节点
 * @param node - dom元素 或 组件元素
 * @param context
 *
 * 返回 { props: [属性名节点、属性值节点、修饰符节点]}
 */
export const transformModel: DirectiveTransform = (dir, node, context) => {
  // 属性值节点 和 属性名参数节点
  const { exp, arg } = dir
  if (!exp) {
    // v-model 属性值节点必须存在

    // 注意：在html 文档中，<div id="app"><span v-model></span></div>，通过innerHTML，获取模版信息时，属性默认值为""，即得到的template = document.querySelector('#app').innerHTML = '<span v-model=""></span>'
    // 与在组件上直接定义属性 template: '<span v-model></span>' 不同

    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_NO_EXPRESSION, dir.loc),
    )
    return createTransformProps() // { props: [] }
  }

  // we assume v-model directives are always parsed
  // (not artificially created by a transform)
  const rawExp = exp.loc.source // 指令节点值源码
  const expString =
    exp.type === NodeTypes.SIMPLE_EXPRESSION ? exp.content : rawExp

  // TODO: analyze
  // im SFC <script setup> inline mode, the exp may have been transformed into
  // _unref(exp)
  const bindingType = context.bindingMetadata[rawExp]

  // check props
  if (
    bindingType === BindingTypes.PROPS ||
    bindingType === BindingTypes.PROPS_ALIASED
  ) {
    context.onError(createCompilerError(ErrorCodes.X_V_MODEL_ON_PROPS, exp.loc))
    return createTransformProps()
  }

  const maybeRef =
    !__BROWSER__ &&
    context.inline &&
    (bindingType === BindingTypes.SETUP_LET ||
      bindingType === BindingTypes.SETUP_REF ||
      bindingType === BindingTypes.SETUP_MAYBE_REF)

  // 必须有值，不可为空，如：v-model=""
  // 或者 v-model绑定的应该是一个变量或某个对象属性，如：$_abc[foo][bar] 或 $_abc.foo.bar
  if (
    !expString.trim() ||
    (!isMemberExpression(expString, context) && !maybeRef)
  ) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_MALFORMED_EXPRESSION, exp.loc),
    )
    return createTransformProps() // 返回一个空属性节点列表 { props: [] }
  }

  // TODO: analyze
  if (
    !__BROWSER__ &&
    context.prefixIdentifiers &&
    isSimpleIdentifier(expString) &&
    context.identifiers[expString]
  ) {
    context.onError(
      createCompilerError(ErrorCodes.X_V_MODEL_ON_SCOPE_VARIABLE, exp.loc),
    )
    return createTransformProps()
  }

  // 指令参数节点

  // 属性名 指令参数内容
  // dom 环境下，v-model 目前暂时没有参数节点arg，如： v-model:arg.trim="value"
  const propName = arg ? arg : createSimpleExpression('modelValue', true)

  // 属性值节点 key

  const eventName = arg
    ? isStaticExp(arg) // arg不存在时 false
      ? `onUpdate:${camelize(arg.content)}` // 静态指令 如 v-model:myValue 则 eventName = 'onUpdate:myValue'
      : createCompoundExpression(['"onUpdate:" + ', arg]) // 动态指令， v-model:[someProp]
    : `onUpdate:modelValue` // 空指令参数 <input v-model="inputText" />， 默认： eventName = 'onUpdate:modelValue'

  // 属性值节点 value

  let assignmentExp: ExpressionNode
  const eventArg = context.isTS ? `($event: any)` : `$event` // isTS，编译为TS格式代码
  if (maybeRef) {
    // TODO: cfs
    if (bindingType === BindingTypes.SETUP_REF) {
      // v-model used on known ref.
      assignmentExp = createCompoundExpression([
        `${eventArg} => ((`,
        createSimpleExpression(rawExp, false, exp.loc),
        `).value = $event)`,
      ])
    } else {
      // v-model used on a potentially ref binding in <script setup> inline mode.
      // the assignment needs to check whether the binding is actually a ref.
      const altAssignment =
        bindingType === BindingTypes.SETUP_LET ? `${rawExp} = $event` : `null`
      assignmentExp = createCompoundExpression([
        `${eventArg} => (${context.helperString(IS_REF)}(${rawExp}) ? (`,
        createSimpleExpression(rawExp, false, exp.loc),
        `).value = $event : ${altAssignment})`,
      ])
    }
  } else {
    // ['($event: any) => (', exp, ' = $event)']
    assignmentExp = createCompoundExpression([
      `${eventArg} => ((`,
      exp,
      `) = $event)`,
    ])
  }

  // 转换为新的属性节点
  const props = [
    // 属性名节点 modelValue: foo
    createObjectProperty(propName, dir.exp!), // 属性名节点： 绑定的model属性
    // 属性值节点 "onUpdate:modelValue": $event => (foo = $event)
    createObjectProperty(eventName, assignmentExp), // 属性值节点：属性值代表的事件、属性值赋值
  ]

  // TODO: analyze
  // cache v-model handler if applicable (when it doesn't refer any scope vars)
  if (
    !__BROWSER__ &&
    context.prefixIdentifiers &&
    !context.inVOnce &&
    context.cacheHandlers &&
    !hasScopeRef(exp, context.identifiers)
  ) {
    props[1].value = context.cache(props[1].value)
  }

  // 修饰符

  // modelModifiers: { foo: true, "bar-baz": true }
  // 组件 template: <input-component v-model.number.trim.lazy="changeText" placeholder="input test" />
  if (dir.modifiers.length && node.tagType === ElementTypes.COMPONENT) {
    // 处理一些非常规的修饰符
    const modifiers = dir.modifiers
      // 简单标识符：非数字开头，且只包含 '[\$A-Za-z0-9_]'，如：'$foo_123'； 否则如 'v-model.{foo:123}' 转换为 '"{foo:123}": true'，注意：不能是 {foo: 123}，之间不能有空格，因为ast解析时，在解析属性名边界时，将空格作为结束边界
      // template: '<input-component v-model.{foo:123}="changeText" placeholder="input test" />', 注意 与直接写在dom文档上，然后innerHTML获取模版相比 会不一样
      .map(m => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`)
      .join(`, `)

    // 修饰符节点 key
    const modifiersKey = arg
      ? isStaticExp(arg) // 存在指令参数
        ? `${arg.content}Modifiers` // 静态指令
        : createCompoundExpression([arg, ' + "Modifiers"']) // 动态指令
      : `modelModifiers` // 默认

    props.push(
      // 修饰符节点 添加修饰符属性codegen节点
      createObjectProperty(
        modifiersKey,
        createSimpleExpression(
          // 修饰符 属性值
          `{ ${modifiers} }`,
          false,
          dir.loc,
          ConstantTypes.CAN_HOIST,
        ),
      ),
    )
  }

  return createTransformProps(props)
}

function createTransformProps(props: Property[] = []) {
  return { props } // { props: [] }
}
