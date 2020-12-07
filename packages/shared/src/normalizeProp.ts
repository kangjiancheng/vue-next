import { isArray, isString, isObject, hyphenate } from './'
import { isNoUnitNumericStyleProp } from './domAttrConfig'

export type NormalizedStyle = Record<string, string | number>

export function normalizeStyle(value: unknown): NormalizedStyle | undefined {
  if (isArray(value)) {
    const res: Record<string, string | number> = {}
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      const normalized = normalizeStyle(
        isString(item) ? parseStringStyle(item) : item
      )
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key]
        }
      }
    }
    return res
  } else if (isObject(value)) {
    return value
  }
}

// 行内 style样式属性 定界符/分隔符 ： 即 ';' 后边不能是 /[^(]*\)/ 即不能是 ';xxxx)'，但是如果后边 存在 '(' 则也匹配： ';x(xx)' 或者 ';xxxx' —— 匹配 ';' 成功
// 如：style = 'color:blue; background-url: (url)'，可以匹配到 ';'， 如果是 style = 'color:blue; background-url: url)'，则匹配不到
const listDelimiterRE = /;(?![^(]*\))/g // 注意 断言匹配'空隙'，所以只匹配的是 ';'，空隙后面只是额外条件，不进行捕获
// 属性分隔符
const propertyDelimiterRE = /:(.+)/

// 行内样式转换对象样式
// 如：parseStringStyle('color: red;font-size: 12px;') =》 {color: "red", font-size: "12px"}，匹配到符号条件的分隔符 ';'
// 注意：parseStringStyle('color: red;font-size: 12px;)') =》 {color: "red;font-size: 12px;)"} 错误写法，没有匹配的分隔符 ';'
export function parseStringStyle(cssText: string): NormalizedStyle {
  const ret: NormalizedStyle = {}
  cssText.split(listDelimiterRE).forEach(item => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE)
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return ret
}

export function stringifyStyle(styles: NormalizedStyle | undefined): string {
  let ret = ''
  if (!styles) {
    return ret
  }
  for (const key in styles) {
    const value = styles[key]
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key)
    if (
      isString(value) ||
      (typeof value === 'number' && isNoUnitNumericStyleProp(normalizedKey))
    ) {
      // only render valid values
      ret += `${normalizedKey}:${value};`
    }
  }
  return ret
}

export function normalizeClass(value: unknown): string {
  let res = ''
  if (isString(value)) {
    res = value
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      res += normalizeClass(value[i]) + ' '
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + ' '
      }
    }
  }
  return res.trim()
}
