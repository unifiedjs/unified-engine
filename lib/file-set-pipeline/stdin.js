import createDebug from 'debug'
import concatStream from 'concat-stream'
import {toVFile} from 'to-vfile'

const debug = createDebug('unified-engine:file-set-pipeline:stdin')

export function stdin(context, settings, next) {
  let error

  if (settings.files && settings.files.length > 0) {
    debug('Ignoring `streamIn`')

    if (settings.filePath) {
      error = new Error(
        'Do not pass both `--file-path` and real files.\nDid you mean to pass stdin instead of files?'
      )
    }

    next(error)

    return
  }

  if (settings.streamIn.isTTY) {
    debug('Cannot read from `tty` stream')
    next(new Error('No input'))

    return
  }

  debug('Reading from `streamIn`')

  settings.streamIn.pipe(concatStream({encoding: 'string'}, read))

  function read(value) {
    const file = toVFile(settings.filePath || undefined)

    debug('Read from `streamIn`')

    file.cwd = settings.cwd
    file.value = value
    file.data.unifiedEngineGiven = true
    file.data.unifiedEngineStreamIn = true

    context.files = [file]

    // If `out` was not set, set `out`.
    settings.out =
      settings.out === null || settings.out === undefined ? true : settings.out

    next()
  }
}
