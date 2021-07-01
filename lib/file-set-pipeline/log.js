import load from 'load-plugin'
import report from 'vfile-reporter'

export function log(context, settings, next) {
  var reporter = settings.reporter || report
  var diagnostics

  if (typeof reporter === 'string') {
    try {
      reporter = load(reporter, {cwd: settings.cwd, prefix: 'vfile-reporter'})
    } catch (_) {
      next(new Error('Could not find reporter `' + reporter + '`'))
      return
    }
  }

  diagnostics = reporter(
    context.files.filter(given),
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

function given(file) {
  return file.data.unifiedEngineGiven
}
