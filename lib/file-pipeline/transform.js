import createDebug from 'debug'
import stats from 'vfile-statistics'

var debug = createDebug('unified-engine:file-pipeline:transform')

// Transform the tree associated with a file with configured plugins.
export function transform(context, file, fileSet, next) {
  if (stats(file).fatal) {
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
