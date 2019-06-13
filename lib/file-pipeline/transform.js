'use strict'

var debug = require('debug')('unified-engine:file-pipeline:transform')
var stats = require('vfile-statistics')

module.exports = transform

// Transform the tree associated with a file with configured plugins.
function transform(context, file, fileSet, next) {
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
