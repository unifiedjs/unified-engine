'use strict'

var FileSet = require('../file-set.js')
var filePipeline = require('../file-pipeline/index.js')

module.exports = transform

// Transform all files.
function transform(context, settings, next) {
  var fileSet = new FileSet()

  context.fileSet = fileSet

  fileSet.on('add', add).on('done', next)

  if (context.files.length === 0) {
    next()
  } else {
    context.files.forEach(fileSet.add, fileSet)
  }

  function add(file) {
    filePipeline.run(
      {
        configuration: context.configuration,
        processor: settings.processor(),
        cwd: settings.cwd,
        extensions: settings.extensions,
        pluginPrefix: settings.pluginPrefix,
        treeIn: settings.treeIn,
        treeOut: settings.treeOut,
        inspect: settings.inspect,
        color: settings.color,
        out: settings.out,
        output: settings.output,
        streamOut: settings.streamOut,
        alwaysStringify: settings.alwaysStringify
      },
      file,
      fileSet,
      done
    )

    function done(error) {
      /* istanbul ignore next - Does not occur as all failures in `filePipeLine`
       * are failed on each file.
       * Still, just to ensure things work in the future, we add an extra
       * check. */
      if (error) {
        error = file.message(error)
        error.fatal = true
      }

      fileSet.emit('one', file)
    }
  }
}
