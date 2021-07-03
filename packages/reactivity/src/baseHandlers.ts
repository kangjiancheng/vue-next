import {
  reactive,
  readonly,
  toRaw,
  ReactiveFlags,
  Target,
  readonlyMap,
  reactiveMap,
  shallowReactiveMap,
  shallowReadonlyMap
} from './reactive'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import {
  track,
  trigger,
  ITERATE_KEY,
  pauseTracking,
  resetTracking
} from './effect'
import {
  isObject,
  hasOwn,
  isSymbol,
  hasChanged,
  isArray,
  isIntegerKey,
  extend,
  makeMap
} from '@vue/shared'
import { isRef } from './ref'

const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`)

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol) // typeof val === 'symbol'
)

const get = /*#__PURE__*/ createGetter()
const shallowGet = /*#__PURE__*/ createGetter(false, true)
const readonlyGet = /*#__PURE__*/ createGetter(true)
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true)

const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations()

// 对数组方法和数据进行响应
function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    const method = Array.prototype[key] as any
    instrumentations[key] = function(this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this)
      for (let i = 0, l = this.length; i < l; i++) {
        // 访问数据时，并进行跟踪数组，指定跟踪索引
        track(arr, TrackOpTypes.GET, i + '')
      }
      // 执行数组方法
      // we run the method using the original args first (which may be reactive)
      const res = method.apply(arr, args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return method.apply(arr, args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    const method = Array.prototype[key] as any
    // 重新封装array这些方法
    instrumentations[key] = function(this: unknown[], ...args: unknown[]) {
      // 开始执行这些方法时：停止跟踪数据变化，避免因数组长度变化而导致的无限更新
      pauseTracking()
      // 会触发数组对象proxy: 先触发get获取操作索引；再触发set进行设值，并触发依赖更新（类型ADD)
      const res = method.apply(this, args)
      resetTracking()
      return res
    }
  })
  return instrumentations
}

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 判断对象是否响应 - isReactive(proxy)
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 判断对象是否只读 - isReadonly(proxy)
      return isReadonly
    } else if (
      key === ReactiveFlags.RAW && // 访问对象当原始对象 - toRaw(proxy)
      receiver === // receiver：触发该拦截方法的操作对象（一般为Proxy实例对象，注意原型链）
        (isReadonly
          ? shallow
            ? shallowReadonlyMap
            : readonlyMap
          : shallow
            ? shallowReactiveMap
            : reactiveMap
        ).get(target)
    ) {
      // 访问 原生对象
      // toRaw(target)
      return target
    }

    // 响应对象 为 数组
    const targetIsArray = isArray(target)

    // 如 访问数组某个方法：let list = reactive([1, 2, 3]); list.includes(1)
    // 注意可以正常访问数组索引（索引也是属性）: list[0]
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      // 返回数组这些方法
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    const res = Reflect.get(target, key, receiver)

    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      // Symbol对象的内置属性与方法、__proto__,__v_isRef,__isVue
      return res
    }

    // 访问时，同时保持跟踪收集依赖组件effect
    if (!isReadonly) {
      // 跟踪不可读对象的某个key，
      // 不跟踪仅读的属性：如在执行 setup(shallowReadonly(instance.props), setupContext) 时，不对ctx的props进行跟踪
      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      // shallow 直接返回，不进行深层次访问，响应式转换，如 渲染模版直接访问 ctx.props上的属性
      return res
    }

    if (isRef(res)) {
      // key的value 为 通过 ref() 创建的响应式对象
      // ref unwrapping - does not apply for Array + integer key.
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key) // 非数组 或 非整数
      return shouldUnwrap ? res.value : res
    }

    // 对象深层次响应转换：如果key的value 为对象，需要进一步响应转换
    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

const set = /*#__PURE__*/ createSetter()
const shallowSet = /*#__PURE__*/ createSetter(true)

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    if (!shallow) {
      value = toRaw(value)
      oldValue = toRaw(oldValue)
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        // 针对属性为ref对象
        // 非数组，且之前为ref对象，但是新值不是ref对象 - 目的：方便不用通过调用ref value属性来设置 新值
        oldValue.value = value
        return true
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    // 修改属性值
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)

    // 触发依赖更新 - 必须是定义时的响应式对象访问该属性，不可以通过原型链来访问该响应式对象的属性
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        // 添加新值
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        // 修改值
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}

function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key)
  const oldValue = (target as any)[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key)
  }
  return result
}

function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, isArray(target) ? 'length' : ITERATE_KEY)
  return Reflect.ownKeys(target)
}

// 代理普通对象：Array、Object，如 在setup中: reactive({ name: '小明' })
export const mutableHandlers: ProxyHandler<object> = {
  get, // createGetter
  set, // createSetter
  deleteProperty,
  has,
  ownKeys
}

export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet, // createGetter(true)
  set(target, key) {
    if (__DEV__) {
      console.warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`, // 如不可在setup在中修改props属性
        target
      )
    }
    return true
  },
  deleteProperty(target, key) {
    if (__DEV__) {
      console.warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}

// 如 instance.props，在执行渲染函数期间，渲染函数访问ctx上的props属性
export const shallowReactiveHandlers = /*#__PURE__*/ extend(
  {},
  mutableHandlers,
  {
    get: shallowGet, // createGetter(false, true)
    set: shallowSet
  }
)

// 如在执行 setup(shallowReadonly(instance.props), setupContext)

// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
export const shallowReadonlyHandlers = /*#__PURE__*/ extend(
  {},
  readonlyHandlers,
  {
    get: shallowReadonlyGet // createGetter(true, true)
  }
)
