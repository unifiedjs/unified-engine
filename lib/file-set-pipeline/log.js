import {loadPlugin} from 'load-plugin'
import {reporter} from 'vfile-reporter'

export async function log(context, settings) {
  let func = settings.reporter || reporter
  let diagnostics

  if (typeof func === 'string') {
    try {
      func = await loadPlugin(func, {
        cwd: settings.cwd,
        prefix: 'vfile-reporter'
      })
    } catch {
      throw new Error('Could not find reporter `' + func + '`')
    }
  }

  diagnostics = func(
    context.files.filter((file) => file.data.unifiedEngineGiven),
    Object.assign({}, settings.reporterOptions, {
      quiet: settings.quiet,
      silent: settings.silent,
      color: settings.color
    })
  )

  if (diagnostics) {
    if (diagnostics.charAt(diagnostics.length - 1) !== '\n') {
      diagnostics += '\n'
    }

    return new Promise((resolve) => {
      settings.streamError.write(diagnostics, resolve)
    })
  }
}
