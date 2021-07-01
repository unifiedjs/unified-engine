import createDebug from 'debug'
import statistics from 'vfile-statistics'
import parseJson from 'parse-json'

const debug = createDebug('unified-engine:file-pipeline:parse')

// Fill a file with a tree.
export function parse(context, file) {
  if (statistics(file).fatal) {
    return
  }

  if (context.treeIn) {
    debug('Not parsing already parsed document')

    try {
      context.tree = parseJson(file.toString())
    } catch (error) {
      const message = file.message(
        new Error('Cannot read file as JSON\n' + error.message)
      )
      message.fatal = true
    }

    // Add the preferred extension to ensure the file, when serialized, is
    // correctly recognised.
    // Only add it if there is a path — not if the file is for example stdin.
    if (file.path) {
      file.extname = context.extensions[0]
    }

    file.contents = ''

    return
  }

  debug('Parsing `%s`', file.path)

  context.tree = context.processor.parse(file)

  debug('Parsed document')
}
