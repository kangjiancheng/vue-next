import {
  reactive,
  readonly,
  toRaw,
  ReactiveFlags,
  Target,
  readonlyMap,
  reactiveMap,
  shallowReactiveMap,
  shallowReadonlyMap,
  isReadonly,
  isShallow
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
  makeMap
} from '@vue/shared'
import { isRef } from './ref'
import { warn } from './warning'

const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`)

const builtInSymbols = new Set(
  /*#__PURE__*/
  Object.getOwnPropertyNames(Symbol)
    // ios10.x Object.getOwnPropertyNames(Symbol) can enumerate 'arguments' and 'caller'
    // but accessing them on Symbol leads to TypeError because Symbol is a strict mode
    // function
    .filter(key => key !== 'arguments' && key !== 'caller')
    .map(key => (Symbol as any)[key])
    .filter(isSymbol) // typeof val === 'symbol'
)

const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations()

// 对数组方法和数据进行响应
function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  // instrument identity-sensitive Array methods to account for possible reactive
  // values
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      for (let i = 0, l = this.length; i < l; i++) {
        // 访问数据时，并进行跟踪数组，指定跟踪索引
        track(arr, TrackOpTypes.GET, i + '')
      }
      // 执行数组方法
      // we run the method using the original args first (which may be reactive)
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // if that didn't work, run it again using raw values.
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })
  // instrument length-altering mutation methods to avoid length being tracked
  // which leads to infinite loops in some cases (#2137)
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    // 重新封装array这些方法
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      // 开始执行这些方法时：停止跟踪数据变化，避免因数组长度变化而导致的无限更新
      pauseTracking()
      // 会触发数组对象proxy: 先触发get获取操作索引；再触发set进行设值，并触发依赖更新（类型ADD)
      const res = (toRaw(this) as any)[key].apply(this, args)
      resetTracking()
      return res
    }
  })
  return instrumentations
}

function hasOwnProperty(this: object, key: string) {
  const obj = toRaw(this)
  track(obj, TrackOpTypes.HAS, key)
  return obj.hasOwnProperty(key)
}

class BaseReactiveHandler implements ProxyHandler<Target> {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _shallow = false
  ) {}

  get(target: Target, key: string | symbol, receiver: object) {
    const isReadonly = this._isReadonly,
      shallow = this._shallow
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 判断对象是否响应 - isReactive(proxy)
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 判断对象是否只读 - isReadonly(proxy)
      return isReadonly
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow
    } else if (key === ReactiveFlags.RAW) {
      // 访问对象当原始对象 - toRaw(proxy)
      if (
        receiver === // receiver：触发该拦截方法的操作对象（一般为Proxy实例对象，注意原型链）
          (isReadonly
            ? shallow
              ? shallowReadonlyMap
              : readonlyMap
            : shallow
              ? shallowReactiveMap
              : reactiveMap
          ).get(target) ||
        // receiver is not the reactive proxy, but has the same prototype
        // this means the reciever is a user proxy of the reactive proxy
        Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)
      ) {
        // 访问 原生对象
        // toRaw(target)
        return target
      }
      // early return undefined
      return
    }

    // 响应对象 为 数组
    const targetIsArray = isArray(target)

    if (!isReadonly) {
      // 如 访问数组某个方法：let list = reactive([1, 2, 3]); list.includes(1)
      // 注意可以正常访问数组索引（索引也是属性）: list[0]
      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
        // 返回数组这些方法
        return Reflect.get(arrayInstrumentations, key, receiver)
      }
      if (key === 'hasOwnProperty') {
        return hasOwnProperty
      }
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
      // ref unwrapping - skip unwrap for Array + integer key.
      return targetIsArray && isIntegerKey(key) ? res : res.value
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

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(shallow = false) {
    super(false, shallow)
  }

  set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    if (!this._shallow) {
      const isOldValueReadonly = isReadonly(oldValue)
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        // 针对属性为ref对象
        // 非数组，且之前为ref对象，但是新值不是ref对象 - 目的：方便不用通过调用ref value属性来设置 新值
        if (isOldValueReadonly) {
          return false
        } else {
          oldValue.value = value
          return true
        }
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

  deleteProperty(target: object, key: string | symbol): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = (target as any)[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
      trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
  }

  has(target: object, key: string | symbol): boolean {
    const result = Reflect.has(target, key)
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, TrackOpTypes.HAS, key)
    }
    return result
  }
  ownKeys(target: object): (string | symbol)[] {
    track(
      target,
      TrackOpTypes.ITERATE,
      isArray(target) ? 'length' : ITERATE_KEY
    )
    return Reflect.ownKeys(target)
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(shallow = false) {
    super(true, shallow)
  }

  set(target: object, key: string | symbol) {
    if (__DEV__) {
      warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`, // 如不可在setup在中修改props属性
        target
      )
    }
    return true
  }

  deleteProperty(target: object, key: string | symbol) {
    if (__DEV__) {
      warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}

// 代理普通对象：Array、Object，如 在setup中: reactive({ name: '小明' })
export const mutableHandlers: ProxyHandler<object> =
  /*#__PURE__*/ new MutableReactiveHandler()

export const readonlyHandlers: ProxyHandler<object> =
  /*#__PURE__*/ new ReadonlyReactiveHandler()

// 如 instance.props，在执行渲染函数期间，渲染函数访问ctx上的props属性
export const shallowReactiveHandlers = /*#__PURE__*/ new MutableReactiveHandler(
  true
)

// 如在执行 setup(shallowReadonly(instance.props), setupContext)

// Props handlers are special in the sense that it should not unwrap top-level
// refs (in order to allow refs to be explicitly passed down), but should
// retain the reactivity of the normal readonly object.
export const shallowReadonlyHandlers =
  /*#__PURE__*/ new ReadonlyReactiveHandler(true)
