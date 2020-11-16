import {
  toRaw,
  shallowReactive,
  trigger,
  TriggerOpTypes
} from '@vue/reactivity'
import {
  EMPTY_OBJ,
  camelize,
  hyphenate,
  capitalize,
  isString,
  isFunction,
  isArray,
  isObject,
  hasOwn,
  toRawType,
  PatchFlags,
  makeMap,
  isReservedProp,
  EMPTY_ARR,
  def,
  extend
} from '@vue/shared'
import { warn } from './warning'
import {
  Data,
  ComponentInternalInstance,
  ComponentOptions,
  ConcreteComponent,
  setCurrentInstance
} from './component'
import { isEmitListener } from './componentEmits'
import { InternalObjectKey } from './vnode'
import { AppContext } from './apiCreateApp'

export type ComponentPropsOptions<P = Data> =
  | ComponentObjectPropsOptions<P>
  | string[]

export type ComponentObjectPropsOptions<P = Data> = {
  [K in keyof P]: Prop<P[K]> | null
}

export type Prop<T, D = T> = PropOptions<T, D> | PropType<T>

type DefaultFactory<T> = (props: Data) => T | null | undefined

interface PropOptions<T = any, D = T> {
  type?: PropType<T> | true | null
  required?: boolean
  default?: D | DefaultFactory<D> | null | undefined | object
  validator?(value: unknown): boolean
}

export type PropType<T> = PropConstructor<T> | PropConstructor<T>[]

type PropConstructor<T = any> =
  | { new (...args: any[]): T & object }
  | { (): T }
  | PropMethod<T>

type PropMethod<T, TConstructor = any> = T extends (...args: any) => any // if is function with args
  ? { new (): TConstructor; (): T; readonly prototype: TConstructor } // Create Function like constructor
  : never

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends
    | { required: true }
    | { default: any }
    // don't mark Boolean props as undefined
    | BooleanConstructor
    | { type: BooleanConstructor }
    ? K
    : never
}[keyof T]

type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>

type DefaultKeys<T> = {
  [K in keyof T]: T[K] extends
    | { default: any }
    // Boolean implicitly defaults to false
    | BooleanConstructor
    | { type: BooleanConstructor }
    ? T[K] extends { type: BooleanConstructor; required: true } // not default if Boolean is marked as required
      ? never
      : K
    : never
}[keyof T]

type InferPropType<T> = T extends null
  ? any // null & true would fail to infer
  : T extends { type: null | true }
    ? any // As TS issue https://github.com/Microsoft/TypeScript/issues/14829 // somehow `ObjectConstructor` when inferred from { (): T } becomes `any` // `BooleanConstructor` when inferred from PropConstructor(with PropMethod) becomes `Boolean`
    : T extends ObjectConstructor | { type: ObjectConstructor }
      ? Record<string, any>
      : T extends BooleanConstructor | { type: BooleanConstructor }
        ? boolean
        : T extends Prop<infer V, infer D> ? (unknown extends V ? D : V) : T

export type ExtractPropTypes<O> = O extends object
  ? { [K in RequiredKeys<O>]: InferPropType<O[K]> } &
      { [K in OptionalKeys<O>]?: InferPropType<O[K]> }
  : { [K in string]: any }

const enum BooleanFlags {
  shouldCast,
  shouldCastTrue
}

// extract props which defined with default from prop options
export type ExtractDefaultPropTypes<O> = O extends object
  ? { [K in DefaultKeys<O>]: InferPropType<O[K]> }
  : {}

type NormalizedProp =
  | null
  | (PropOptions & {
      [BooleanFlags.shouldCast]?: boolean
      [BooleanFlags.shouldCastTrue]?: boolean
    })

// normalized value is a tuple of the actual normalized options
// and an array of prop keys that need value casting (booleans and defaults)
export type NormalizedProps = Record<string, NormalizedProp>
export type NormalizedPropsOptions = [NormalizedProps, string[]] | []

/**
 * 生成有效的props: 结合组件所定义的props属性 和 传进给组件的props
 * 生成有效 props和attrs 即接收传进来的props，并进行类型校验、默认值处理等
 */
export function initProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null, // 传给组件的props：rootProps（非组件上的props属性）
  isStateful: number, // result of bitwise flag comparison
  isSSR = false
) {
  const props: Data = {} // 存储传进来的props的值，这些props是在组件上已经声明了
  const attrs: Data = {} // 存储没有声明的props（虽然确实传递了，当 组件的props属性里 没有声明校验）
  // 设定 attrs.__vInternal = 1
  def(attrs, InternalObjectKey, 1)

  // 将传进组件的props 与 组件所定义的props列表 进行对比
  // 设置组件接收到的 props 和 attrs，并设置props的默认值
  setFullProps(instance, rawProps, props, attrs)
  // validation
  if (__DEV__) {
    // 开发环境验证，验证prop的 required、type、validator
    validateProps(props, instance)
  }

  if (isStateful) {
    // stateful：状态式组件 component
    // 浏览器环境下，对props进行响应式处理
    instance.props = isSSR ? props : shallowReactive(props)
  } else {
    if (!instance.type.props) {
      // functional w/ optional props, props === attrs
      // 如果 props属性没有定义，则默认接收所有传递进来的属性
      instance.props = attrs
    } else {
      // functional w/ declared props
      instance.props = props
    }
  }
  instance.attrs = attrs
}

export function updateProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null,
  rawPrevProps: Data | null,
  optimized: boolean
) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance
  const rawCurrentProps = toRaw(props)
  const [options] = instance.propsOptions

  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    !(
      __DEV__ &&
      (instance.type.__hmrId ||
        (instance.parent && instance.parent.type.__hmrId))
    ) &&
    (optimized || patchFlag > 0) &&
    !(patchFlag & PatchFlags.FULL_PROPS)
  ) {
    if (patchFlag & PatchFlags.PROPS) {
      // Compiler-generated props & no keys change, just set the updated
      // the props.
      const propsToUpdate = instance.vnode.dynamicProps!
      for (let i = 0; i < propsToUpdate.length; i++) {
        const key = propsToUpdate[i]
        // PROPS flag guarantees rawProps to be non-null
        const value = rawProps![key]
        if (options) {
          // attr / props separation was done on init and will be consistent
          // in this code path, so just check if attrs have it.
          if (hasOwn(attrs, key)) {
            attrs[key] = value
          } else {
            const camelizedKey = camelize(key)
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance
            )
          }
        } else {
          attrs[key] = value
        }
      }
    }
  } else {
    // full props update.
    setFullProps(instance, rawProps, props, attrs)
    // in case of dynamic props, check if we need to delete keys from
    // the props object
    let kebabKey: string
    for (const key in rawCurrentProps) {
      if (
        !rawProps ||
        // for camelCase
        (!hasOwn(rawProps, key) &&
          // it's possible the original props was passed in as kebab-case
          // and converted to camelCase (#955)
          ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))
      ) {
        if (options) {
          if (
            rawPrevProps &&
            // for camelCase
            (rawPrevProps[key] !== undefined ||
              // for kebab-case
              rawPrevProps[kebabKey!] !== undefined)
          ) {
            props[key] = resolvePropValue(
              options,
              rawProps || EMPTY_OBJ,
              key,
              undefined,
              instance
            )
          }
        } else {
          delete props[key]
        }
      }
    }
    // in the case of functional component w/o props declaration, props and
    // attrs point to the same object so it should already have been updated.
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key)) {
          delete attrs[key]
        }
      }
    }
  }

  // trigger updates for $attrs in case it's used in component slots
  trigger(instance, TriggerOpTypes.SET, '$attrs')

  if (__DEV__ && rawProps) {
    validateProps(props, instance)
  }
}

// 将传进组件上的 props的值 保存起来到props和attrs，同时设置props的默认值
function setFullProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null, // 传给组件的props：如rootProps（非组件上的props属性）
  props: Data, // 存储组件接收到的props，已经进行类型检测、默认值处理、赋值操作等。
  attrs: Data // 存储 那些传给组件但组件未定义 的props属性
) {
  // options 为规范后的组件所定义的 props 属性
  // instance.propsOptions 为组件上的 __props
  const [options, needCastKeys] = instance.propsOptions
  if (rawProps) {
    // 传入的 props
    for (const key in rawProps) {
      const value = rawProps[key]
      // 不处理vue 保留的关键 prop key，如：key、ref、或空字符串key，即不能传入这些到组件
      // key, ref are reserved and never passed down
      if (isReservedProp(key)) {
        continue
      }
      // prop option names are camelized during normalization, so to support
      // kebab -> camel conversion here we need to camelize the key.
      let camelKey
      if (options && hasOwn(options, (camelKey = camelize(key)))) {
        // '传给组件的props' 如果在 '组件定义的props里' 则赋值保存到有效的props
        props[camelKey] = value
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        // '传入给组件的props' 如果不在 '组件的校验props里'，同时也不是一个emit事件， 则赋值保存到attrs
        attrs[key] = value
      }
    }
  }

  // boolean类型或有默认值
  if (needCastKeys) {
    const rawCurrentProps = toRaw(props) // 首次还是不变，即还是当前这个值

    // 针对 可以需要校验为boolean 类型 或有默认值的prop
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i]
      // 设置prop的默认值
      props[key] = resolvePropValue(
        options!, // 排除undefined/null
        rawCurrentProps,
        key, // 传入的prop，
        rawCurrentProps[key], // 传入的 prop的值
        instance
      )
    }
  }
}

// 处理带有默认值的props 或 Boolean类型校验
function resolvePropValue(
  options: NormalizedProps,
  props: Data, // 处理后的有效props，带实际值，即传进组件的prop并在组件里声明了
  key: string, // needCastKeys[i]
  value: unknown, // 传入的 prop的值
  instance: ComponentInternalInstance
) {
  const opt = options[key] // 组件上声明的prop
  if (opt != null) {
    const hasDefault = hasOwn(opt, 'default')
    // default values，设置prop的默认值
    if (hasDefault && value === undefined) {
      const defaultValue = opt.default
      /**
       * prop的默认值，即当default属性值是函数时，需要根据type 是否是 Function
       *  是 - prop的默认值是这个 default函数，
       *  不是 - prop的默认值是这个 default函数的返回值
       */
      if (opt.type !== Function && isFunction(defaultValue)) {
        // default属性值虽然是一个函数，但prop的默认值实际是这个函数的返回值
        setCurrentInstance(instance)
        value = defaultValue(props)
        setCurrentInstance(null)
      } else {
        // value 是一个基本类型 或是一个函数（type 需定义为 Function）
        value = defaultValue
      }
    }
    // boolean casting
    // 进一步处理默认值，处理boolean类型的默认值
    if (opt[BooleanFlags.shouldCast]) {
      if (!hasOwn(props, key) && !hasDefault) {
        // 没有向组件传入这个 Boolean prop，且这个组件也没为这个prop设置默认值
        value = false
      } else if (
        opt[BooleanFlags.shouldCastTrue] &&
        (value === '' || value === hyphenate(key))
      ) {
        // opt[BooleanFlags.shouldCastTrue] = true 此时：
        // opt.type 不是String类型 或 或String比Boolean类型 声明偏后
        value = true
      }
    }
  }
  // 默认值可以直接是 null
  return value
}

// 规范 组件的props属性 格式
export function normalizePropsOptions(
  comp: ConcreteComponent, // 根组件
  appContext: AppContext, // app 上下文
  asMixin = false
): NormalizedPropsOptions {
  if (!appContext.deopt && comp.__props) {
    return comp.__props
  }

  const raw = comp.props // 组件所定义的props
  const normalized: NormalizedPropsOptions[0] = {}
  const needCastKeys: NormalizedPropsOptions[1] = []

  // apply mixin/extends props
  let hasExtends = false
  if (__FEATURE_OPTIONS_API__ && !isFunction(comp)) {
    const extendProps = (raw: ComponentOptions) => {
      hasExtends = true
      const [props, keys] = normalizePropsOptions(raw, appContext, true)
      extend(normalized, props)
      if (keys) needCastKeys.push(...keys)
    }
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps)
    }
    if (comp.extends) {
      extendProps(comp.extends)
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps)
    }
  }

  // 没有props
  if (!raw && !hasExtends) {
    return (comp.__props = EMPTY_ARR as any)
  }

  if (isArray(raw)) {
    // props 为数组格式：如 props: ['age', 'name', ...]
    // 转换为 对象格式：props: { age: {}, name: {} }
    for (let i = 0; i < raw.length; i++) {
      if (__DEV__ && !isString(raw[i])) {
        warn(`props must be strings when using array syntax.`, raw[i])
      }
      const normalizedKey = camelize(raw[i])
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ
      }
    }
  } else if (raw) {
    // props 必须是 对象格式，如 props: { age: Number, name: String }
    // comp.__props: normalized 内部规范: age : {0: false, 1: true, type: Number}
    if (__DEV__ && !isObject(raw)) {
      warn(`invalid props options`, raw)
    }
    for (const key in raw) {
      // camelCase 小驼峰
      const normalizedKey = camelize(key)
      // props不能已$开头
      if (validatePropName(normalizedKey)) {
        // 进一步规范prop的值
        const opt = raw[key] // prop 的类型值
        // 调整prop格式，赋值type
        // 正常格式 如 prop: { type: Number, default: 123 }
        // prop: Boolean => prop: { type: Boolean }
        const prop: NormalizedProp = (normalized[normalizedKey] =
          isArray(opt) || isFunction(opt) ? { type: opt } : opt)

        if (prop) {
          // 如果prop值存在（注意正常情况下，prop接收的是一个类型值）
          // 分3种情况处理：数组、函数、其它
          // 数组时，返回Boolean类型的索引，函数返回0，其它返回 1
          const booleanIndex = getTypeIndex(Boolean, prop.type) // 判断是否是Boolean类型（可以函数或是数组） 返回 Boolean 的位置
          const stringIndex = getTypeIndex(String, prop.type) // 返回 String 在数组中的位置

          // 为了处理 类型为Boolean的默认值
          prop[BooleanFlags.shouldCast] = booleanIndex > -1 // prop[0]  true，表明有Boolean类型，为了将默认值转换为 false
          prop[BooleanFlags.shouldCastTrue] =
            stringIndex < 0 || booleanIndex < stringIndex // prop[1] true，String 类型不存在 或 存在且比 Boolean 靠后

          // if the prop needs boolean casting or default value
          if (booleanIndex > -1 || hasOwn(prop, 'default')) {
            // prop是 boolean 类型 或有默认值
            needCastKeys.push(normalizedKey)
          }
        }
      }
    }
  }

  return (comp.__props = [normalized, needCastKeys])
}

function validatePropName(key: string) {
  if (key[0] !== '$') {
    return true
  } else if (__DEV__) {
    warn(`Invalid prop name: "${key}" is a reserved property.`)
  }
  return false
}

// use function string name to check type constructors
// so that it works across vms / iframes.
function getType(ctor: Prop<any>): string {
  // 返回一个类型
  const match = ctor && ctor.toString().match(/^\s*function (\w+)/)
  return match ? match[1] : ''
}

function isSameType(a: Prop<any>, b: Prop<any>): boolean {
  return getType(a) === getType(b)
}

// 获取某个类型在某个类型集合中的位置
function getTypeIndex(
  type: Prop<any>,
  expectedTypes: PropType<any> | void | null | true // prop的type值，即prop的值
): number {
  if (isArray(expectedTypes)) {
    // 返回 指定类型的索引
    for (let i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
  } else if (isFunction(expectedTypes)) {
    // 当只prop的type只是一个类型是，判断是否类型相等
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  return -1
}

/**
 * dev only
 */
function validateProps(props: Data, instance: ComponentInternalInstance) {
  // props 为组件接收到的属性集合，且已规范格式和设置完默认值
  const rawValues = toRaw(props)
  const options = instance.propsOptions[0] // 已规范后的组件的props属性列表
  for (const key in options) {
    let opt = options[key]
    if (opt == null) continue
    validateProp(key, rawValues[key], opt, !hasOwn(rawValues, key))
  }
}

/**
 * dev only
 */
function validateProp(
  name: string, // 组件上声明prop的 key 键名
  value: unknown, // 组件接收到的prop的值
  prop: PropOptions, // 组件上声明prop的 value 值
  isAbsent: boolean // 组件上key 是否在 在已接收的props里
) {
  const { type, required, validator } = prop
  // required!
  if (required && isAbsent) {
    warn('Missing required prop: "' + name + '"')
    return
  }
  // missing but optional
  if (value == null && !prop.required) {
    // 默认值 可以是 null
    return
  }

  // 判断传入prop属性类型是否符合定义的type
  // type check
  if (type != null && type !== true) {
    let isValid = false
    const types = isArray(type) ? type : [type]
    const expectedTypes = []
    // value is valid as long as one of the specified types match
    // 只要传入的prop属性的类型 存在于 此prop期望接收的类型列表里， 就是有效的类型
    for (let i = 0; i < types.length && !isValid; i++) {
      // 判断 value 类型是否符合 types中的某一个，isValid=true 就立刻停止判断
      const { valid, expectedType } = assertType(value, types[i])
      expectedTypes.push(expectedType || '')
      isValid = valid
    }
    if (!isValid) {
      // 所有 expectedTypes 都没符合，就报错
      warn(getInvalidTypeMessage(name, value, expectedTypes))
      return
    }
  }

  // 自定义 验证，返回值为false，则验证失败
  // custom validator
  if (validator && !validator(value)) {
    warn('Invalid prop: custom validator check failed for prop "' + name + '".')
  }
}

const isSimpleType = /*#__PURE__*/ makeMap(
  'String,Number,Boolean,Function,Symbol'
)

type AssertionResult = {
  valid: boolean
  expectedType: string
}

/**
 * dev only
 */
// 判断 value的类型是否符合type,
// value 为 传入的prop的值
// type 为 组件里prop能接收的类型
function assertType(value: unknown, type: PropConstructor): AssertionResult {
  let valid
  const expectedType = getType(type) // 期望的类型

  // 基本数据类型
  if (isSimpleType(expectedType)) {
    const t = typeof value
    valid = t === expectedType.toLowerCase()

    // 如果是 基本数据类型函数的实例，如：value = new String('xxx')
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type
    }
  } else if (expectedType === 'Object') {
    valid = isObject(value)
  } else if (expectedType === 'Array') {
    valid = isArray(value)
  } else {
    valid = value instanceof type
  }
  return {
    valid,
    expectedType
  }
}

/**
 * dev only
 */
// 类型校验出错，报错提示
function getInvalidTypeMessage(
  name: string,
  value: unknown,
  expectedTypes: string[]
): string {
  let message =
    `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`
  const expectedType = expectedTypes[0]
  const receivedType = toRawType(value)
  const expectedValue = styleValue(value, expectedType)
  const receivedValue = styleValue(value, receivedType)
  // check if we need to specify expected value
  if (
    expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    !isBoolean(expectedType, receivedType)
  ) {
    message += ` with value ${expectedValue}`
  }
  message += `, got ${receivedType} `
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}.`
  }
  return message
}

/**
 * dev only
 */
function styleValue(value: unknown, type: string): string {
  if (type === 'String') {
    return `"${value}"`
  } else if (type === 'Number') {
    return `${Number(value)}`
  } else {
    return `${value}`
  }
}

/**
 * dev only
 */
function isExplicable(type: string): boolean {
  const explicitTypes = ['string', 'number', 'boolean']
  return explicitTypes.some(elem => type.toLowerCase() === elem)
}

/**
 * dev only
 */
function isBoolean(...args: string[]): boolean {
  return args.some(elem => elem.toLowerCase() === 'boolean')
}
