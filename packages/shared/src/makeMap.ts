/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * IMPORTANT: all calls of this function must be prefixed with
 * \/\*#\_\_PURE\_\_\*\/
 * So that rollup can tree-shake them if necessary.
 */

// 添加注释：'/*#__PURE__*/'
// 表明一个函数是纯函数，没有副作用，可以进行tree shaking
// @see: https://babeljs.io/blog/2018/08/27/7.0.0#pure-annotation-support

// 返回一个带有指定集合对象的函数，该函数可以检测某变量是否属于此集合
export function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => boolean {
  const map: Record<string, boolean> = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}
