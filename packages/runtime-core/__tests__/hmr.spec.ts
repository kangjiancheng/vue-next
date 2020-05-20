import { HMRRuntime } from '../src/hmr'
import '../src/hmr'
import { ComponentOptions, InternalRenderFunction } from '../src/component'
import {
  render,
  nodeOps,
  h,
  serializeInner,
  triggerEvent,
  TestElement,
  nextTick
} from '@vue/runtime-test'
import * as runtimeTest from '@vue/runtime-test'
import { baseCompile } from '@vue/compiler-core'

declare var __VUE_HMR_RUNTIME__: HMRRuntime
const { createRecord, rerender, reload } = __VUE_HMR_RUNTIME__

function compileToFunction(template: string) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(
    runtimeTest
  ) as InternalRenderFunction
  render._rc = true // isRuntimeCompiled
  return render
}

describe('hot module replacement', () => {
  test('inject global runtime', () => {
    expect(createRecord).toBeDefined()
    expect(rerender).toBeDefined()
    expect(reload).toBeDefined()
  })

  test('createRecord', () => {
    expect(createRecord('test1', {})).toBe(true)
    // if id has already been created, should return false
    expect(createRecord('test1', {})).toBe(false)
  })

  test('rerender', async () => {
    const root = nodeOps.createElement('div')
    const parentId = 'test2-parent'
    const childId = 'test2-child'

    const Child: ComponentOptions = {
      __hmrId: childId,
      render: compileToFunction(`<slot/>`)
    }
    createRecord(childId, Child)

    const Parent: ComponentOptions = {
      __hmrId: parentId,
      data() {
        return { count: 0 }
      },
      components: { Child },
      render: compileToFunction(
        `<div @click="count++">{{ count }}<Child>{{ count }}</Child></div>`
      )
    }
    createRecord(parentId, Parent)

    render(h(Parent), root)
    expect(serializeInner(root)).toBe(`<div>00</div>`)

    // Perform some state change. This change should be preserved after the
    // re-render!
    triggerEvent(root.children[0] as TestElement, 'click')
    await nextTick()
    expect(serializeInner(root)).toBe(`<div>11</div>`)

    // // Update text while preserving state
    rerender(
      parentId,
      compileToFunction(
        `<div @click="count++">{{ count }}!<Child>{{ count }}</Child></div>`
      )
    )
    expect(serializeInner(root)).toBe(`<div>1!1</div>`)

    // Should force child update on slot content change
    rerender(
      parentId,
      compileToFunction(
        `<div @click="count++">{{ count }}!<Child>{{ count }}!</Child></div>`
      )
    )
    expect(serializeInner(root)).toBe(`<div>1!1!</div>`)

    // Should force update element children despite block optimization
    rerender(
      parentId,
      compileToFunction(
        `<div @click="count++">{{ count }}<span>{{ count }}</span>
        <Child>{{ count }}!</Child>
      </div>`
      )
    )
    expect(serializeInner(root)).toBe(`<div>1<span>1</span>1!</div>`)

    // Should force update child slot elements
    rerender(
      parentId,
      compileToFunction(
        `<div @click="count++">
        <Child><span>{{ count }}</span></Child>
      </div>`
      )
    )
    expect(serializeInner(root)).toBe(`<div><span>1</span></div>`)
  })

  test('reload', async () => {
    const root = nodeOps.createElement('div')
    const childId = 'test3-child'
    const unmountSpy = jest.fn()
    const mountSpy = jest.fn()

    const Child: ComponentOptions = {
      __hmrId: childId,
      data() {
        return { count: 0 }
      },
      unmounted: unmountSpy,
      render: compileToFunction(`<div @click="count++">{{ count }}</div>`)
    }
    createRecord(childId, Child)

    const Parent: ComponentOptions = {
      render: () => h(Child)
    }

    render(h(Parent), root)
    expect(serializeInner(root)).toBe(`<div>0</div>`)

    reload(childId, {
      __hmrId: childId,
      data() {
        return { count: 1 }
      },
      mounted: mountSpy,
      render: compileToFunction(`<div @click="count++">{{ count }}</div>`)
    })
    await nextTick()
    expect(serializeInner(root)).toBe(`<div>1</div>`)
    expect(unmountSpy).toHaveBeenCalledTimes(1)
    expect(mountSpy).toHaveBeenCalledTimes(1)
  })

  // #1156 - static nodes should retain DOM element reference across updates
  // when HMR is active
  test('static el reference', async () => {
    const root = nodeOps.createElement('div')
    const id = 'test-static-el'

    const template = `<div>
    <div>{{ count }}</div>
    <button @click="count++">++</button>
  </div>`

    const Comp: ComponentOptions = {
      __hmrId: id,
      data() {
        return { count: 0 }
      },
      render: compileToFunction(template)
    }
    createRecord(id, Comp)

    render(h(Comp), root)
    expect(serializeInner(root)).toBe(
      `<div><div>0</div><button>++</button></div>`
    )

    // 1. click to trigger update
    triggerEvent((root as any).children[0].children[1], 'click')
    await nextTick()
    expect(serializeInner(root)).toBe(
      `<div><div>1</div><button>++</button></div>`
    )

    // 2. trigger HMR
    rerender(
      id,
      compileToFunction(template.replace(`<button`, `<button class="foo"`))
    )
    expect(serializeInner(root)).toBe(
      `<div><div>1</div><button class="foo">++</button></div>`
    )
  })

  // #1157 - component should force full props update when HMR is active
  test('force update child component w/ static props', () => {
    const root = nodeOps.createElement('div')
    const parentId = 'test-force-props-parent'
    const childId = 'test-force-props-child'

    const Child: ComponentOptions = {
      __hmrId: childId,
      props: {
        msg: String
      },
      render: compileToFunction(`<div>{{ msg }}</div>`)
    }
    createRecord(childId, Child)

    const Parent: ComponentOptions = {
      __hmrId: parentId,
      components: { Child },
      render: compileToFunction(`<Child msg="foo" />`)
    }
    createRecord(parentId, Parent)

    render(h(Parent), root)
    expect(serializeInner(root)).toBe(`<div>foo</div>`)

    rerender(parentId, compileToFunction(`<Child msg="bar" />`))
    expect(serializeInner(root)).toBe(`<div>bar</div>`)
  })
})
