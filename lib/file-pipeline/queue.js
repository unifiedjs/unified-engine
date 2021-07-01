import createDebug from 'debug'
import stats from 'vfile-statistics'

var debug = createDebug('unified-engine:file-pipeline:queue')

// Queue all files which came this far.
// When the last file gets here, run the file-set pipeline and flush the queue.
export function queue(context, file, fileSet, next) {
  var origin = file.history[0]
  var map = fileSet.complete
  var complete = true

  if (!map) {
    map = {}
    fileSet.complete = map
  }

  debug('Queueing `%s`', origin)

  map[origin] = next

  fileSet.valueOf().forEach(each)

  if (!complete) {
    debug('Not flushing: some files cannot be flushed')
    return
  }

  fileSet.complete = {}

  fileSet.pipeline.run(fileSet, done)

  function each(file) {
    var key = file.history[0]

    if (stats(file).fatal) {
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
      map[origin](error)
    }
  }
}
