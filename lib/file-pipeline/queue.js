/**
 * @import {Callback} from 'trough'
 * @import {VFile} from 'vfile'
 * @import {Context} from './index.js'
 */

import createDebug from 'debug'

const debug = createDebug('unified-engine:file-pipeline:queue')

const own = {}.hasOwnProperty

/**
 * Queue all files which came this far.
 * When the last file gets here, run the file-set pipeline and flush the queue.
 *
 * @param {Context} context
 *   Context.
 * @param {VFile} file
 *   File.
 * @param {Callback} next
 *   Callback.
 * @returns {undefined}
 *   Nothing.
 */
export function queue(context, file, next) {
  let origin = file.history[0]

  // Do not wait for files added after the flush.
  if (context.fileSet.flushed) {
    debug('Not queueing `%s`: already flushed', origin)
    next()
    return
  }

  const map = context.fileSet.complete
  let complete = true

  debug('Queueing `%s`', origin)

  map[origin] = next

  const files = context.fileSet.valueOf()
  let index = -1
  while (++index < files.length) {
    each(files[index])
  }

  if (!complete) {
    debug('Not flushing: some files cannot be flushed')
    return
  }

  context.fileSet.complete = {}
  context.fileSet.flushed = true
  context.fileSet.pipeline.run(context.fileSet, done)

  /**
   * Check whether a file is ready.
   *
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  function each(file) {
    const key = file.history[0]

    // Every file is queued, even fatal ones, which may still be transforming.
    if (typeof map[key] === 'function') {
      debug('`%s` can be flushed', key)
    } else {
      debug('Interrupting flush: `%s` is not finished', key)
      complete = false
    }
  }

  /**
   * Handle the completers being done, by flushing all files.
   *
   * @param {Error | undefined} error
   *   Error.
   * @returns {undefined}
   *   Nothing.
   */
  function done(error) {
    debug('Flushing: completers are done')

    // Flush.
    for (origin in map) {
      if (own.call(map, origin)) {
        map[origin](error)
      }
    }
  }
}
