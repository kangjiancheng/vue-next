import { isArray, isString, isObject, hyphenate } from './'

export type NormalizedStyle = Record<string, string | number>

// 规范style为对象，并合并
export function normalizeStyle(
  value: unknown
): NormalizedStyle | string | undefined {
  if (isArray(value)) {
    const res: NormalizedStyle = {}
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      const normalized = isString(item)
        ? parseStringStyle(item)
        : (normalizeStyle(item) as NormalizedStyle)
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key]
        }
      }
    }
    return res
  } else if (isString(value)) {
    return value
  } else if (isObject(value)) {
    return value
  }
}

// 行内 style样式属性 定界符/分隔符 ： 即 ';' 后边不能是 /[^(]*\)/ 即不能是 ';xxxx)'，但是如果后边 存在 '(' 则也匹配： ';x(xx)' 或者 ';xxxx' —— 匹配 ';' 成功
// 如：style = 'color:blue; background-url: (url)'，可以匹配到 ';'， 如果是 style = 'color:blue; background-url: url)'，则匹配不到
const listDelimiterRE = /;(?![^(]*\))/g // 注意 断言匹配'空隙'，所以只匹配的是 ';'，空隙后面只是额外条件，不进行捕获
// 属性分隔符
const propertyDelimiterRE = /:([^]+)/
const styleCommentRE = /\/\*.*?\*\//gs

// 行内样式转换对象样式
// 如：parseStringStyle('color: red;font-size: 12px;') =》 {"color": "red", "font-size": "12px"}，匹配到符号条件的分隔符 ';'
// 注意：parseStringStyle('color: red;font-size: 12px;)') =》 {"color": "red;font-size: 12px;)"} 错误写法，没有匹配的分隔符 ';'
export function parseStringStyle(cssText: string): NormalizedStyle {
  const ret: NormalizedStyle = {}
  cssText
    .replace(styleCommentRE, '')
    .split(listDelimiterRE)
    .forEach(item => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE)
        tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
      }
    })
  return ret
}

export function stringifyStyle(
  styles: NormalizedStyle | string | undefined
): string {
  let ret = ''
  if (!styles || isString(styles)) {
    return ret
  }
  for (const key in styles) {
    const value = styles[key]
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key)
    if (isString(value) || typeof value === 'number') {
      // only render valid values
      ret += `${normalizedKey}:${value};`
    }
  }
  return ret
}

// 规范节点属性的 class: 字符串、数组、对象
export function normalizeClass(value: unknown): string {
  let res = ''
  if (isString(value)) {
    // class属性的值 是字符串，直接返回
    res = value
  } else if (isArray(value)) {
    // class属性的值 是数组，比如 class属性合并成的数组，需要转换为 dom节点上的属性的格式：空格 隔开
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
  } else if (isObject(value)) {
    // class 是对象格式
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim()
}

export function normalizeProps(props: Record<string, any> | null) {
  if (!props) return null
  let { class: klass, style } = props
  if (klass && !isString(klass)) {
    props.class = normalizeClass(klass)
  }
  if (style) {
    props.style = normalizeStyle(style)
  }
  return props
}
