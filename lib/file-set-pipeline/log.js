import load from 'load-plugin'
import reporter from 'vfile-reporter'

export function log(context, settings, next) {
  let func = settings.reporter || reporter
  let diagnostics

  if (typeof func === 'string') {
    try {
      func = load(func, {cwd: settings.cwd, prefix: 'vfile-reporter'})
    } catch {
      next(new Error('Could not find reporter `' + func + '`'))
      return
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

    settings.streamError.write(diagnostics, next)
  } else {
    next()
  }
}
