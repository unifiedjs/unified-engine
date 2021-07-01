import {FileSet} from '../file-set.js'
import {filePipeline} from '../file-pipeline/index.js'

// Transform all files.
export function transform(context, settings, next) {
  const fileSet = new FileSet()

  context.fileSet = fileSet

  fileSet.on('add', add).on('done', next)

  if (context.files.length === 0) {
    next()
  } else {
    let index = -1
    while (++index < context.files.length) {
      fileSet.add(context.files[index])
    }
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
      // Does not occur as all failures in `filePipeLine` are failed on each
      // file.
      // Still, just to ensure things work in the future, we add an extra check.
      /* c8 ignore next 4 */
      if (error) {
        error = file.message(error)
        error.fatal = true
      }

      fileSet.emit('one', file)
    }
  }
}
