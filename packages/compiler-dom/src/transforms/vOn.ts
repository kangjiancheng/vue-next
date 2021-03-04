import {
  transformOn as baseTransform,
  DirectiveTransform,
  createObjectProperty,
  createCallExpression,
  createSimpleExpression,
  NodeTypes,
  createCompoundExpression,
  ExpressionNode,
  SimpleExpressionNode,
  isStaticExp
} from '@vue/compiler-core'
import { V_ON_WITH_MODIFIERS, V_ON_WITH_KEYS } from '../runtimeHelpers'
import { makeMap, capitalize } from '@vue/shared'

const isEventOptionModifier = /*#__PURE__*/ makeMap(`passive,once,capture`)
const isNonKeyModifier = /*#__PURE__*/ makeMap(
  // event propagation management
  `stop,prevent,self,` +
    // system modifiers + exact
    `ctrl,shift,alt,meta,exact,` +
    // mouse
    `middle`
)
// 可能是鼠标，也可能是键盘上的按键事件
// left & right could be mouse or key modifiers based on event type
const maybeKeyModifier = /*#__PURE__*/ makeMap('left,right')
// 判断触发事件
const isKeyboardEvent = /*#__PURE__*/ makeMap(
  `onkeyup,onkeydown,onkeypress`,
  true
)

/**
 * 区分修饰符所属目标事件流程类型
 * @param key 指令属性名的codegen节点
 * @param modifiers 指令修饰符列表
 */
const resolveModifiers = (key: ExpressionNode, modifiers: string[]) => {
  const keyModifiers = []
  const nonKeyModifiers = []
  const eventOptionModifiers = []

  for (let i = 0; i < modifiers.length; i++) {
    const modifier = modifiers[i]

    if (isEventOptionModifier(modifier)) {
      // 事件监听方法 addEventListener：passive,once,capture
      // eventOptionModifiers: modifiers for addEventListener() options,
      // e.g. .passive & .capture
      eventOptionModifiers.push(modifier)
    } else {
      // runtimeModifiers: modifiers that needs runtime guards
      if (maybeKeyModifier(modifier)) {
        // 修饰符：left,right

        if (isStaticExp(key)) {
          // 在运行时，判断到底是鼠标触发还是键盘触发
          if (isKeyboardEvent((key as SimpleExpressionNode).content)) {
            // 如果是键盘触发的，则归入键盘修饰符列表
            keyModifiers.push(modifier)
          } else {
            // 否则是鼠标
            nonKeyModifiers.push(modifier)
          }
        } else {
          // 静态指令时，都加入，键盘根鼠标都可以触发
          keyModifiers.push(modifier)
          nonKeyModifiers.push(modifier)
        }
      } else {
        if (isNonKeyModifier(modifier)) {
          // 特殊修饰符：stop、prevent、ctrl、execa、middle
          nonKeyModifiers.push(modifier)
        } else {
          // 具体键盘按键：@keyup.enter 回车修饰符
          keyModifiers.push(modifier)
        }
      }
    }
  }

  return {
    keyModifiers, // 具体键盘按键，如回车键修饰符：@keyup.enter
    nonKeyModifiers, // 特殊键盘按键 如 shift、ctrl、或 鼠标middle 或 事件流程 prevent、stop
    eventOptionModifiers // 事件流程 passive,once,capture
  }
}

/**
 * 转换click事件中的一些特殊修饰符触发的情况，如鼠标middle，把它转换为mouseup
 */
const transformClick = (key: ExpressionNode, event: string) => {
  // 静态指令，如 <button onclick="" v-on:click=""></button>
  // 动态指令，如 <button onclick="" v-on:[eventName]=""></button>
  const isStaticClick =
    isStaticExp(key) && key.content.toLowerCase() === 'onclick' // 在处理指令名阶段，已经加上on前缀
  return isStaticClick
    ? createSimpleExpression(event, true) // 静态指令
    : key.type !== NodeTypes.SIMPLE_EXPRESSION // 动态指令 需要转换为复合codegen节点
      ? createCompoundExpression([
          `(`,
          key,
          `) === "onClick" ? "${event}" : (`,
          key,
          `)`
        ])
      : key // 已经是复合（在处理属性名阶段已经进行转换）
}

// 解析dom节点上的v-on指令
export const transformOn: DirectiveTransform = (dir, node, context) => {
  /**
   * ast
   * baseTransform:  compiler-core transformOn 处理转换on指令的属性名，属性值
   * dir:  指令属性节点
   * node： dom元素节点或组件节点
   * context: ast transform 上下文
   *
   * baseResult: 经过 compiler-core 的transform 处理后，得到指令props对应的codegen js属性节点 createObjectProperty(指令属性名节点（不包含modifiers）, 指令属性值节点)
   */
  return baseTransform(dir, node, context, baseResult => {
    // 事件修饰符modifiers

    // 指令修饰符：@click.prevent 中的 'prevent'
    const { modifiers } = dir
    if (!modifiers.length) return baseResult

    // key 指令属性名节点， value： 指令属性值节点；注意都以经过createSimpleExpression转换处理，且key中没有modifiers信息
    let { key, value: handlerExp } = baseResult.props[0] // 正在解析的指令属性节点

    // 解析修饰符类型
    const {
      keyModifiers, // 具体键盘按键，如回车键修饰符：@keyup.enter，某些按键存在left/right
      nonKeyModifiers, // 特殊键盘按键 如 shift、ctrl、alt、meta、exec 或 鼠标middle、left、right 或 事件流程 prevent、stop、self
      eventOptionModifiers // 基本事件流程：passive,once,capture
    } = resolveModifiers(key, modifiers)

    // normalize click.right and click.middle since they don't actually fire
    // 调整click.right和click.middle事件，正常情况下并不会触发
    if (nonKeyModifiers.includes('right')) {
      key = transformClick(key, `onContextmenu`)
    }
    if (nonKeyModifiers.includes('middle')) {
      key = transformClick(key, `onMouseup`)
    }

    if (nonKeyModifiers.length) {
      // 转换为函数节点 Symbol(vOnModifiersGuard)
      // 如 <button @click.prevent="handleClick"></button>
      handlerExp = createCallExpression(context.helper(V_ON_WITH_MODIFIERS), [
        handlerExp, // 指令属性值
        JSON.stringify(nonKeyModifiers)
      ])
    }

    if (
      keyModifiers.length &&
      // if event name is dynamic, always wrap with keys guard
      (!isStaticExp(key) || isKeyboardEvent(key.content)) //动态指令 或键盘事件'keyup'、'keypress'
    ) {
      // 转换为函数节点 Symbol(vOnKeysGuard)
      // 如 <button @[eventName].enter="handleEnter"></button>，其中eventName如 'keyup'、'keypress'
      handlerExp = createCallExpression(context.helper(V_ON_WITH_KEYS), [
        handlerExp,
        JSON.stringify(keyModifiers)
      ])
    }

    if (eventOptionModifiers.length) {
      // 如 <button @click.once.capture.passive="handleClick"></button>
      // 'OnceCapturePassive'
      const modifierPostfix = eventOptionModifiers.map(capitalize).join('')

      // 重新调整指令属性名节点
      key = isStaticExp(key)
        ? createSimpleExpression(`${key.content}${modifierPostfix}`, true) // 静态指令 onClickOnceCapturePassive
        : createCompoundExpression([`(`, key, `) + "${modifierPostfix}"`]) //动态指令
    }

    // 调整指令属性名节点、指令属性值节点
    return {
      props: [createObjectProperty(key, handlerExp)]
    }
  })
}
