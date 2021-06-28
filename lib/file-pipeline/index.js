'use strict'

var trough = require('trough')
var read = require('./read.js')
var configure = require('./configure.js')
var parse = require('./parse.js')
var transform = require('./transform.js')
var queue = require('./queue.js')
var stringify = require('./stringify.js')
var copy = require('./copy.js')
var stdout = require('./stdout.js')
var fileSystem = require('./file-system.js')

// This pipeline ensures each of the pipes always runs: even if the read pipe
// fails, queue and write run.
module.exports = trough()
  .use(chunk(trough().use(read).use(configure).use(parse).use(transform)))
  .use(chunk(trough().use(queue)))
  .use(chunk(trough().use(stringify).use(copy).use(stdout).use(fileSystem)))

// Factory to run a pipe.
// Wraps a pipe to trigger an error on the `file` in `context`, but still call
// `next`.
function chunk(pipe) {
  return run

  // Run the bound bound pipe and handles any errors.
  function run(context, file, fileSet, next) {
    pipe.run(context, file, fileSet, one)

    function one(error) {
      var messages = file.messages
      var index

      if (error) {
        index = messages.indexOf(error)

        if (index === -1) {
          error = file.message(error)
          index = messages.length - 1
        }

        messages[index].fatal = true
      }

      next()
    }
  }
}
