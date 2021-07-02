import createDebug from 'debug'
import {statistics} from 'vfile-statistics'

const debug = createDebug('unified-engine:file-pipeline:transform')

// Transform the tree associated with a file with configured plugins.
export function transform(context, file, _, next) {
  if (statistics(file).fatal) {
    next()
  } else {
    debug('Transforming document `%s`', file.path)
    context.processor.run(context.tree, file, onrun)
  }

  function onrun(error, node) {
    debug('Transformed document (error: %s)', error)
    context.tree = node
    next(error)
  }
}
