// This entry is the "full-build" that includes both the runtime
// and the compiler, and supports on-the-fly compilation of the template option.
import { initDev } from './dev'
import { compile, CompilerOptions, CompilerError } from '@vue/compiler-dom'
import { registerRuntimeCompiler, RenderFunction, warn } from '@vue/runtime-dom'
import * as runtimeDom from '@vue/runtime-dom'
import { isString, NOOP, generateCodeFrame, extend } from '@vue/shared'
import { InternalRenderFunction } from 'packages/runtime-core/src/component'

if (__DEV__ || __FEATURE_PROD_DEVTOOLS__) {
  initDev()
}

const compileCache: Record<string, RenderFunction> = Object.create(null)

// 当执行完setup函数后， 将template编译为 render函数
function compileToFunction(
  template: string | HTMLElement,
  options?: CompilerOptions
): RenderFunction {
  if (!isString(template)) {
    if (template.nodeType) {
      template = template.innerHTML
    } else {
      __DEV__ && warn(`invalid template option: `, template)
      return NOOP
    }
  }

  // 以模板内容为key，缓存编译结果
  const key = template
  const cached = compileCache[key]
  if (cached) {
    return cached
  }

  if (template[0] === '#') {
    const el = document.querySelector(template)
    if (__DEV__ && !el) {
      warn(`Template element not found or is empty: ${template}`)
    }
    // __UNSAFE__
    // Reason: potential execution of JS expressions in in-DOM template.
    // The user must make sure the in-DOM template is trusted. If it's rendered
    // by the server, the template should not contain any user data.
    template = el ? el.innerHTML : ``
  }

  const { code } = compile(
    template,
    extend(
      {
        hoistStatic: true, // 静态提升
        // 解析失败时，比如解析注释失败，当 template = 'abc<!--123' 错误提示：'Template compilation error: Unexpected EOF in comment.'
        onError(err: CompilerError) {
          if (__DEV__) {
            const message = `Template compilation error: ${err.message}` // 错误范围
            const codeFrame =
              err.loc &&
              generateCodeFrame(
                // 输出 '错误源码'
                template as string,
                err.loc.start.offset,
                err.loc.end.offset
              )
            // 控制台输出错误信息
            warn(codeFrame ? `${message}\n${codeFrame}` : message)
          } else {
            /* istanbul ignore next */
            throw err
          }
        }
      },
      options
    )
  )

  // The wildcard import results in a huge object with every export
  // with keys that cannot be mangled, and can be quite heavy size-wise.
  // In the global build we know `Vue` is available globally so we can avoid
  // the wildcard object.
  const render = (__GLOBAL__
    ? new Function(code)()
    : new Function('Vue', code)(runtimeDom)) as RenderFunction

  // mark the function as runtime compiled
  ;(render as InternalRenderFunction)._rc = true

  return (compileCache[key] = render)
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
export * from '@vue/runtime-dom'
