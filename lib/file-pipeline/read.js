import fs from 'fs'
import path from 'path'
import createDebug from 'debug'
import statistics from 'vfile-statistics'

const debug = createDebug('unified-engine:file-pipeline:read')

// Fill a file with its contents when not already filled.
export function read(context, file, _, next) {
  let filePath = file.path

  if (file.contents || file.data.unifiedEngineStreamIn) {
    debug('Not reading file `%s` with contents', filePath)
    next()
  } else if (statistics(file).fatal) {
    debug('Not reading failed file `%s`', filePath)
    next()
  } else {
    filePath = path.resolve(context.cwd, filePath)

    debug('Reading `%s` in `%s`', filePath, 'utf8')
    fs.readFile(filePath, 'utf8', onread)
  }

  function onread(error, contents) {
    debug('Read `%s` (error: %s)', filePath, error)

    file.contents = contents || ''

    next(error)
  }
}
