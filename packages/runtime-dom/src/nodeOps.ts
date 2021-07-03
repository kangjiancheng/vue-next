import { RendererOptions } from '@vue/runtime-core'

export const svgNS = 'http://www.w3.org/2000/svg'

const doc = (typeof document !== 'undefined' ? document : null) as Document

export const nodeOps: Omit<RendererOptions<Node, Element>, 'patchProp'> = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },

  remove: child => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  // 创建一个由标签名称 tag 指定的 HTML 元素
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElement
  createElement: (tag, isSVG, is, props): Element => {
    const el = isSVG
      ? doc.createElementNS(svgNS, tag)
      : doc.createElement(tag, is ? { is } : undefined) // is 为官方可选属性

    if (tag === 'select' && props && props.multiple != null) {
      ;(el as HTMLSelectElement).setAttribute('multiple', props.multiple)
    }

    return el
  },

  createText: text => doc.createTextNode(text),

  createComment: text => doc.createComment(text),

  setText: (node, text) => {
    node.nodeValue = text
  },

  // 设置文本内容
  setElementText: (el, text) => {
    el.textContent = text
  },

  parentNode: node => node.parentNode as Element | null,

  nextSibling: node => node.nextSibling,

  querySelector: selector => doc.querySelector(selector),

  setScopeId(el, id) {
    el.setAttribute(id, '')
  },

  cloneNode(el) {
    const cloned = el.cloneNode(true)
    // #3072
    // - in `patchDOMProp`, we store the actual value in the `el._value` property.
    // - normally, elements using `:value` bindings will not be hoisted, but if
    //   the bound value is a constant, e.g. `:value="true"` - they do get
    //   hoisted.
    // - in production, hoisted nodes are cloned when subsequent inserts, but
    //   cloneNode() does not copy the custom property we attached.
    // - This may need to account for other custom DOM properties we attach to
    //   elements in addition to `_value` in the future.
    if (`_value` in el) {
      ;(cloned as any)._value = (el as any)._value
    }
    return cloned
  },

  // __UNSAFE__
  // Reason: insertAdjacentHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, isSVG, cached) {
    if (cached) {
      let first
      let last
      let i = 0
      let l = cached.length
      for (; i < l; i++) {
        const node = cached[i].cloneNode(true)
        if (i === 0) first = node
        if (i === l - 1) last = node
        parent.insertBefore(node, anchor)
      }
      return [first, last] as any
    }

    // <parent> before | first ... last | anchor </parent>
    const before = anchor ? anchor.previousSibling : parent.lastChild
    if (anchor) {
      let insertionPoint
      let usingTempInsertionPoint = false
      if (anchor instanceof Element) {
        insertionPoint = anchor
      } else {
        // insertAdjacentHTML only works for elements but the anchor is not an
        // element...
        usingTempInsertionPoint = true
        insertionPoint = isSVG
          ? doc.createElementNS(svgNS, 'g')
          : doc.createElement('div')
        parent.insertBefore(insertionPoint, anchor)
      }
      insertionPoint.insertAdjacentHTML('beforebegin', content)
      if (usingTempInsertionPoint) {
        parent.removeChild(insertionPoint)
      }
    } else {
      parent.insertAdjacentHTML('beforeend', content)
    }
    let first = before ? before.nextSibling : parent.firstChild
    const last = anchor ? anchor.previousSibling : parent.lastChild
    const ret = []
    while (first) {
      ret.push(first)
      if (first === last) break
      first = first.nextSibling
    }
    return ret
  }
}
