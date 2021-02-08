import { makeMap } from './makeMap'

const GLOBALS_WHITE_LISTED =
  'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
  'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
  'Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt'

// '/*#__PURE__*/'： 表明一个函数是纯函数，没有副作用，可以进行tree shaking
// @see: https://babeljs.io/blog/2018/08/27/7.0.0#pure-annotation-support

// 返回一个函数，判断 某个字符串 是否属于 GLOBALS_WHITE_LISTED
export const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED)
