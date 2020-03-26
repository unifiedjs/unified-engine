'use strict'

var debug = require('debug')('unified-engine:file-pipeline:parse')
var stats = require('vfile-statistics')
var json = require('parse-json')

module.exports = parse

// Fill a file with a tree.
function parse(context, file) {
  var message

  if (stats(file).fatal) {
    return
  }

  if (context.treeIn) {
    debug('Not parsing already parsed document')

    try {
      context.tree = json(file.toString())
    } catch (error) {
      message = file.message(
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
