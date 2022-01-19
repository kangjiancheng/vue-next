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
  extend,
  isOn,
  IfAny
} from '@vue/shared'
import { warn } from './warning'
import {
  Data,
  ComponentInternalInstance,
  ComponentOptions,
  ConcreteComponent,
  setCurrentInstance,
  unsetCurrentInstance
} from './component'
import { isEmitListener } from './componentEmits'
import { InternalObjectKey } from './vnode'
import { AppContext } from './apiCreateApp'
import { createPropsDefaultThis } from './compat/props'
import { isCompatEnabled, softAssertCompatEnabled } from './compat/compatConfig'
import { DeprecationTypes } from './compat/compatConfig'
import { shouldSkipAttr } from './compat/attrsFallthrough'

export type ComponentPropsOptions<P = Data> =
  | ComponentObjectPropsOptions<P>
  | string[]

export type ComponentObjectPropsOptions<P = Data> = {
  [K in keyof P]: Prop<P[K]> | null
}

export type Prop<T, D = T> = PropOptions<T, D> | PropType<T>

type DefaultFactory<T> = (props: Data) => T | null | undefined

export interface PropOptions<T = any, D = T> {
  type?: PropType<T> | true | null
  required?: boolean
  default?: D | DefaultFactory<D> | null | undefined | object
  validator?(value: unknown): boolean
}

export type PropType<T> = PropConstructor<T> | PropConstructor<T>[]

type PropConstructor<T = any> =
  | { new (...args: any[]): T & {} }
  | { (): T }
  | PropMethod<T>

type PropMethod<T, TConstructor = any> = [T] extends [
  ((...args: any) => any) | undefined
] // if is function with args, allowing non-required functions
  ? { new (): TConstructor; (): T; readonly prototype: TConstructor } // Create Function like constructor
  : never

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends
    | { required: true }
    | { default: any }
    // don't mark Boolean props as undefined
    | BooleanConstructor
    | { type: BooleanConstructor }
    ? T[K] extends { default: undefined | (() => undefined) }
      ? never
      : K
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

type InferPropType<T> = [T] extends [null]
  ? any // null & true would fail to infer
  : [T] extends [{ type: null | true }]
  ? any // As TS issue https://github.com/Microsoft/TypeScript/issues/14829 // somehow `ObjectConstructor` when inferred from { (): T } becomes `any` // `BooleanConstructor` when inferred from PropConstructor(with PropMethod) becomes `Boolean`
  : [T] extends [ObjectConstructor | { type: ObjectConstructor }]
  ? Record<string, any>
  : [T] extends [BooleanConstructor | { type: BooleanConstructor }]
  ? boolean
  : [T] extends [DateConstructor | { type: DateConstructor }]
  ? Date
  : [T] extends [(infer U)[] | { type: (infer U)[] }]
  ? U extends DateConstructor
    ? Date | InferPropType<U>
    : InferPropType<U>
  : [T] extends [Prop<infer V, infer D>]
  ? unknown extends V
    ? IfAny<V, V, D>
    : V
  : T

export type ExtractPropTypes<O> = {
  // use `keyof Pick<O, RequiredKeys<O>>` instead of `RequiredKeys<O>` to support IDE features
  [K in keyof Pick<O, RequiredKeys<O>>]: InferPropType<O[K]>
} & {
  // use `keyof Pick<O, OptionalKeys<O>>` instead of `OptionalKeys<O>` to support IDE features
  [K in keyof Pick<O, OptionalKeys<O>>]?: InferPropType<O[K]>
}

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
 * 生成有效的props和attrs 即接收传进来的props，并进行类型校验、默认值处理等
 *
 * props: 赋值后 的组件对象props属性选项
 * attrs: 未声明 - 在 vnode props中 但未在 组件对象props、emits属性选项
 */
export function initProps(
  instance: ComponentInternalInstance, // 组件实例
  rawProps: Data | null, // 组件vnode的props
  isStateful: number, // result of bitwise flag comparison
  isSSR = false
) {
  const props: Data = {} // 保存 在组件props属性选项里的 vnode props属性，即 已经赋值后 的组件prop属性选项
  const attrs: Data = {} // 不在组件props属性选项里 也不在组件emits属性选项里 的 vnode props属性

  // 设定 attrs.__vInternal = 1
  def(attrs, InternalObjectKey, 1)

  instance.propsDefaults = Object.create(null)

  // 完成组件props的赋值：
  //    将 vnode的props 与 其所定义的props选项 进行对比
  //    设置组件接收到的 props 和 attrs，并设置props的默认值
  setFullProps(instance, rawProps, props, attrs)

  // ensure all declared prop keys are present
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = undefined
    }
  }

  // validation
  if (__DEV__) {
    // 开发环境验证，验证prop的 required、type、validator
    validateProps(rawProps || {}, props, instance)
  }

  if (isStateful) {
    // stateful：状态式组件 component
    // 浏览器环境下，对props进行响应式proxy拦截处理
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

// 更新组件时，在执行渲染函数前 - updateComponentPreRender：更新props - updateProps
export function updateProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null, // 组件渲染模版template vnode props
  rawPrevProps: Data | null, // 组件节点 vnode props
  optimized: boolean
) {
  const {
    props, // 组件props选项（已赋值）
    attrs, //
    vnode: { patchFlag }
  } = instance
  const rawCurrentProps = toRaw(props)
  const [options] = instance.propsOptions // 组件props选项列表
  let hasAttrsChanged = false

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
    !(patchFlag & PatchFlags.FULL_PROPS) // 不 存在动态指令参数 或 v-on/v-bind（无参数）指令
  ) {
    if (patchFlag & PatchFlags.PROPS) {
      // Compiler-generated props & no keys change, just set the updated
      // the props.
      const propsToUpdate = instance.vnode.dynamicProps!
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i]
        // PROPS flag guarantees rawProps to be non-null
        const value = rawProps![key]
        if (options) {
          // attr / props separation was done on init and will be consistent
          // in this code path, so just check if attrs have it.
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value
              hasAttrsChanged = true
            }
          } else {
            const camelizedKey = camelize(key)
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance,
              false /* isAbsent */
            )
          }
        } else {
          if (__COMPAT__) {
            if (isOn(key) && key.endsWith('Native')) {
              key = key.slice(0, -6) // remove Native postfix
            } else if (shouldSkipAttr(key, instance)) {
              continue
            }
          }
          if (value !== attrs[key]) {
            attrs[key] = value
            hasAttrsChanged = true
          }
        }
      }
    }
  } else {
    // full props update.
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true
    }
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
              rawCurrentProps,
              key,
              undefined,
              instance,
              true /* isAbsent */
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
          hasAttrsChanged = true
        }
      }
    }
  }

  // trigger updates for $attrs in case it's used in component slots
  if (hasAttrsChanged) {
    trigger(instance, TriggerOpTypes.SET, '$attrs')
  }

  if (__DEV__) {
    validateProps(rawProps || {}, props, instance)
  }
}

// 将 组件vnode的props 划分为：props、attrs，并进行最终赋值和设置默认值
function setFullProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null, // 组件vnode的props 即组件节点dom元素 上的属性
  props: Data, // 存储 组件接收到的props，已经进行类型检测、默认值处理、赋值操作等。
  attrs: Data // 存储 vnode.props中存在 但 组件props属性选项中不存在 的属性
) {
  // options - 组件 props 属性选项
  const [options, needCastKeys] = instance.propsOptions

  // prop属性赋值
  let hasAttrsChanged = false
  let rawCastValues: Data | undefined
  if (rawProps) {
    for (let key in rawProps) {
      // key, ref are reserved and never passed down
      if (isReservedProp(key)) {
        // 不处理vue 保留的关键 prop key，如：key、ref、或空字符串key，即不能传入这些到组件
        continue
      }

      if (__COMPAT__) {
        if (key.startsWith('onHook:')) {
          softAssertCompatEnabled(
            DeprecationTypes.INSTANCE_EVENT_HOOKS,
            instance,
            key.slice(2).toLowerCase()
          )
        }
        if (key === 'inline-template') {
          continue
        }
      }

      const value = rawProps[key] // vnode prop属性值
      // prop option names are camelized during normalization, so to support
      // kebab -> camel conversion here we need to camelize the key.
      let camelKey
      if (options && hasOwn(options, (camelKey = camelize(key)))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          // '组件vnode的props' 如果在 '组件定义的props选项里' 则赋值保存到有效的props
          props[camelKey] = value
        } else {
          ;(rawCastValues || (rawCastValues = {}))[camelKey] = value
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        // Any non-declared (either as a prop or an emitted event) props are put
        // into a separate `attrs` object for spreading. Make sure to preserve
        // original key casing
        if (__COMPAT__) {
          if (isOn(key) && key.endsWith('Native')) {
            key = key.slice(0, -6) // remove Native postfix
          } else if (shouldSkipAttr(key, instance)) {
            continue
          }
        }
        if (!(key in attrs) || value !== attrs[key]) {
          // 'onUpdate:user-name'
          // 不在组件props属性选项里 也不在组件emits属性选项里
          attrs[key] = value
          hasAttrsChanged = true
        }
      }
    }
  }

  // 进一步完善prop属性赋值：boolean类型或默认值

  if (needCastKeys) {
    const rawCurrentProps = toRaw(props)
    const castValues = rawCastValues || EMPTY_OBJ
    for (let i = 0; i < needCastKeys.length; i++) {
      // prop属性的类型 存在 boolean类型或默认值
      const key = needCastKeys[i]
      props[key] = resolvePropValue(
        options!, // 组件props属性选项
        rawCurrentProps, // 存储组件的有效props
        key, // 传入的prop，
        castValues[key],
        instance,
        !hasOwn(castValues, key)
      )
    }
  }

  return hasAttrsChanged
}

// 解析组件props属性选项 - 存在 boolean类型或默认值，并进行校验和赋值
function resolvePropValue(
  options: NormalizedProps, // props属性选项
  props: Data, // 处理后的有效props，带实际值，即传进组件的prop并在组件里声明了
  key: string, // 存在 boolean类型或默认值 的属性
  value: unknown, // vnode 的props属性 prop value
  instance: ComponentInternalInstance,
  isAbsent: boolean
) {
  const opt = options[key] // 组件上声明的prop

  // 默认值

  if (opt != null) {
    const hasDefault = hasOwn(opt, 'default')

    // 有默认值，但vnode上不传递
    if (hasDefault && value === undefined) {
      const defaultValue = opt.default

      if (opt.type !== Function && isFunction(defaultValue)) {
        const { propsDefaults } = instance
        if (key in propsDefaults) {
          value = propsDefaults[key]
        } else {
          setCurrentInstance(instance)
          value = propsDefaults[key] = defaultValue.call(
            __COMPAT__ &&
              isCompatEnabled(DeprecationTypes.PROPS_DEFAULT_THIS, instance)
              ? createPropsDefaultThis(instance, props, key)
              : null,
            props
          )
          unsetCurrentInstance()
        }
      } else {
        // 默认属性值
        // 默认值为一个函数：当 type = Function 时，说明该属性prop的 默认值 就是 一个函数
        value = defaultValue
      }
    }

    // boolean 类型默认值

    // boolean casting
    if (opt[BooleanFlags.shouldCast]) {
      // 不在 vnode props 中，同时没有默认值
      if (isAbsent && !hasDefault) {
        value = false
      } else if (
        opt[BooleanFlags.shouldCastTrue] &&
        (value === '' || value === hyphenate(key)) // 横线分割第一个大写字母
      ) {
        // opt[BooleanFlags.shouldCastTrue] = true 此时：
        // opt.type 不存在String类型 或 或String比Boolean类型 声明偏后
        value = true
      }
    }
  }
  // 默认值可以直接是 null
  return value
}

// normalized - 规范 组件的props属性选项，如 转换小驼峰、解析属性类型type
// needCastKeys - 收集需要 存在boolean类型或默认值 的属性
export function normalizePropsOptions(
  comp: ConcreteComponent, // 组件对象
  appContext: AppContext, // app 上下文
  asMixin = false
): NormalizedPropsOptions {
  const cache = appContext.propsCache
  const cached = cache.get(comp)
  if (cached) {
    return cached
  }

  const raw = comp.props // 组件的props选项属性
  const normalized: NormalizedPropsOptions[0] = {} // 规范后的属性选项列表，如 转换小驼峰、解析属性类型type
  const needCastKeys: NormalizedPropsOptions[1] = [] // 存在 boolean类型或默认值 的属性选项列表

  // 合并 组件的 mixins属性选项 和 extends属性选项
  // apply mixin/extends props
  let hasExtends = false
  // isBundlerESMBuild ? `__VUE_OPTIONS_API__` : true,
  if (__FEATURE_OPTIONS_API__ && !isFunction(comp)) {
    const extendProps = (raw: ComponentOptions) => {
      if (__COMPAT__ && isFunction(raw)) {
        raw = raw.options
      }
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
    cache.set(comp, EMPTY_ARR as any)
    return EMPTY_ARR as any
  }

  if (isArray(raw)) {
    // props 为数组格式：如 props: ['age', 'name', ...]
    // 转换为 对象格式：props: { age: {}, name: {} }
    for (let i = 0; i < raw.length; i++) {
      if (__DEV__ && !isString(raw[i])) {
        // props 为数组格式时，每个属性都必须是 字符串
        warn(`props must be strings when using array syntax.`, raw[i])
      }
      // 短横线转为小驼峰：'user-name' =》 'userName'
      const normalizedKey = camelize(raw[i])
      // 禁止 '$' 开头
      if (validatePropName(normalizedKey)) {
        // 格式化为 对象形式，如 normalized: { userName: {} }
        normalized[normalizedKey] = EMPTY_OBJ
      }
    }
  } else if (raw) {
    // 针对对象形式的props，如 props: { age: Number }
    // 最终转换结果：comp.__props，即 normalized: { age: {0: false, 1: true, type: Number} }

    if (__DEV__ && !isObject(raw)) {
      // props 必须是 对象格式
      warn(`invalid props options`, raw)
    }

    // 处理props每个属性
    for (const key in raw) {
      // raw 即 组件的 props 属性选项

      const normalizedKey = camelize(key) // camelCase 小驼峰

      if (validatePropName(normalizedKey)) {
        // props不能已$开头

        // key - 属性选项名
        // opt - 属性选项值
        const opt = raw[key]

        // 规范属性值

        // 解析 属性类型 type，如下
        // 如 props: { age: { type: Number, default: 123 } }  // 正确的规范格式
        // 如 props: { age: Number }   规范后为  age: { type: Number }
        // 如 props: { age: [Number, String] }   规范后为  age: { type: [Number, String] }
        const prop: NormalizedProp = (normalized[normalizedKey] =
          isArray(opt) || isFunction(opt) ? { type: opt } : opt)

        if (prop) {
          // 获取prop属性类型列表中的 Boolean 类型的位置
          const booleanIndex = getTypeIndex(Boolean, prop.type)

          // 获取prop属性类型列表中的 String 类型的位置
          const stringIndex = getTypeIndex(String, prop.type)

          // 为了处理 类型为Boolean的默认值

          // prop[0] true - 表示 存在Boolean类型，为了将 默认值 转换为 false
          prop[BooleanFlags.shouldCast] = booleanIndex > -1

          // prop[1] true - 表示 不存在 String 类型 或 存在但比 Boolean 靠后
          // 之后 在解析属性赋值时，将其设置为 true
          prop[BooleanFlags.shouldCastTrue] =
            stringIndex < 0 || booleanIndex < stringIndex

          // if the prop needs boolean casting or default value
          if (booleanIndex > -1 || hasOwn(prop, 'default')) {
            // 存在 boolean类型或默认值
            needCastKeys.push(normalizedKey)
          }
        }
      }
    }
  }

  const res: NormalizedPropsOptions = [normalized, needCastKeys]
  cache.set(comp, res)
  return res
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
  return match ? match[1] : ctor === null ? 'null' : ''
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
    return expectedTypes.findIndex(t => isSameType(t, type))
  } else if (isFunction(expectedTypes)) {
    // 当只prop的type只是一个类型是，判断是否类型相等
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  return -1
}

/**
 * dev only
 */
function validateProps(
  rawProps: Data,
  props: Data, // props 为组件接收到的属性集合，且已规范格式和设置完默认值
  instance: ComponentInternalInstance
) {
  const resolvedValues = toRaw(props)
  const options = instance.propsOptions[0] // 已规范后的组件的props属性列表
  for (const key in options) {
    let opt = options[key]
    if (opt == null) continue
    validateProp(
      key,
      resolvedValues[key],
      opt,
      !hasOwn(rawProps, key) && !hasOwn(rawProps, hyphenate(key))
    )
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
  'String,Number,Boolean,Function,Symbol,BigInt'
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
  } else if (expectedType === 'null') {
    valid = value === null
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
    ` Expected ${expectedTypes.map(capitalize).join(' | ')}`
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
