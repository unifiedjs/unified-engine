import createDebug from 'debug'
import statistics from 'vfile-statistics'

const debug = createDebug('unified-engine:file-pipeline:queue')

const own = {}.hasOwnProperty

// Queue all files which came this far.
// When the last file gets here, run the file-set pipeline and flush the queue.
export function queue(_, file, fileSet, next) {
  let origin = file.history[0]
  let map = fileSet.complete
  let complete = true

  if (!map) {
    map = {}
    fileSet.complete = map
  }

  debug('Queueing `%s`', origin)

  map[origin] = next

  const files = fileSet.valueOf()
  let index = -1
  while (++index < files.length) {
    each(files[index])
  }

  if (!complete) {
    debug('Not flushing: some files cannot be flushed')
    return
  }

  fileSet.complete = {}

  fileSet.pipeline.run(fileSet, done)

  function each(file) {
    const key = file.history[0]

    if (statistics(file).fatal) {
      return
    }

    if (typeof map[key] === 'function') {
      debug('`%s` can be flushed', key)
    } else {
      debug('Interupting flush: `%s` is not finished', key)
      complete = false
    }
  }

  function done(error) {
    debug('Flushing: all files can be flushed')

    // Flush.
    for (origin in map) {
      if (own.call(map, origin)) {
        map[origin](error)
      }
    }
  }
}
