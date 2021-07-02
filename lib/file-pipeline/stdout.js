import createDebug from 'debug'
import {statistics} from 'vfile-statistics'

const debug = createDebug('unified-engine:file-pipeline:stdout')

// Write a virtual file to `streamOut`.
// Ignored when `output` is given, more than one file was processed, or `out`
// is false.
export function stdout(context, file, _, next) {
  if (!file.data.unifiedEngineGiven) {
    debug('Ignoring programmatically added file')
    next()
  } else if (statistics(file).fatal || context.output || !context.out) {
    debug('Ignoring writing to `streamOut`')
    next()
  } else {
    debug('Writing document to `streamOut`')
    context.streamOut.write(file.toString(), next)
  }
}
