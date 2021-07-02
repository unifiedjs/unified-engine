import fs from 'fs'
import path from 'path'
import createDebug from 'debug'
import {statistics} from 'vfile-statistics'

const debug = createDebug('unified-engine:file-pipeline:file-system')

// Write a virtual file to the file-system.
// Ignored when `output` is not given.
export function fileSystem(context, file, _, next) {
  let destinationPath

  if (!context.output) {
    debug('Ignoring writing to file-system')
    return next()
  }

  if (!file.data.unifiedEngineGiven) {
    debug('Ignoring programmatically added file')
    return next()
  }

  destinationPath = file.path

  if (!destinationPath) {
    debug('Cannot write file without a `destinationPath`')
    return next(new Error('Cannot write file without an output path'))
  }

  if (statistics(file).fatal) {
    debug('Cannot write file with a fatal error')
    return next()
  }

  destinationPath = path.resolve(context.cwd, destinationPath)
  debug('Writing document to `%s`', destinationPath)

  file.stored = true

  fs.writeFile(destinationPath, file.toString(), next)
}
