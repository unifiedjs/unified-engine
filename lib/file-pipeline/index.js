import {trough} from 'trough'
import {read} from './read.js'
import {configure} from './configure.js'
import {parse} from './parse.js'
import {transform} from './transform.js'
import {queue} from './queue.js'
import {stringify} from './stringify.js'
import {copy} from './copy.js'
import {stdout} from './stdout.js'
import {fileSystem} from './file-system.js'

// This pipeline ensures each of the pipes always runs: even if the read pipe
// fails, queue and write run.
export const filePipeline = trough()
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
      const messages = file.messages
      let index

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
