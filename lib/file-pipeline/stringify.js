import createDebug from 'debug'
import statistics from 'vfile-statistics'
import isBuffer from 'is-buffer'
import inspect from 'unist-util-inspect'

const debug = createDebug('unified-engine:file-pipeline:stringify')

// Stringify a tree.
export function stringify(context, file) {
  let value

  if (statistics(file).fatal) {
    debug('Not compiling failed document')
    return
  }

  if (!context.output && !context.out && !context.alwaysStringify) {
    debug('Not compiling document without output settings')
    return
  }

  debug('Compiling `%s`', file.path)

  if (context.inspect) {
    // Add a `txt` extension if there is a path.
    if (file.path) {
      file.extname = '.txt'
    }

    value = inspect[context.color ? 'color' : 'noColor'](context.tree) + '\n'
  } else if (context.treeOut) {
    // Add a `json` extension to ensure the file is correctly seen as JSON.
    // Only add it if there is a path — not if the file is for example stdin.
    if (file.path) {
      file.extname = '.json'
    }

    // Add the line feed to create a valid UNIX file.
    value = JSON.stringify(context.tree, null, 2) + '\n'
  } else {
    value = context.processor.stringify(context.tree, file)
  }

  if (value === undefined || value === null) {
    // Empty.
  } else if (typeof value === 'string' || isBuffer(value)) {
    file.contents = value
  } else {
    file.result = value
  }

  debug('Serialized document')
}
