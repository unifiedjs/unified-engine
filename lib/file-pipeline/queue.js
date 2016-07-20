/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline:queue
 * @fileoverview Queue all files which came this far.
 */

'use strict';

/* Dependencies. */
var debug = require('debug')('unified-engine:file-pipeline:queue');

/* Expose. */
module.exports = queue;

/**
 * Queue all files which came this far.
 * When the last file gets here, run the file-set pipeline
 * and flush the queue.
 *
 * @param {Object} context - Context.
 * @param {File} file - File.
 * @param {FileSet} fileSet - Set.
 * @param {function(Error?)} done - Completion handler.
 */
function queue(context, file, fileSet, done) {
  var sourcePath = file.namespace('unified-engine').sourcePath;
  var map = fileSet.complete;
  var complete = true;

  if (!map) {
    map = fileSet.complete = {};
  }

  debug('Queueing `%s`', sourcePath);

  map[sourcePath] = done;

  fileSet.valueOf().forEach(function (file) {
    var key = file.namespace('unified-engine').sourcePath;

    if (file.hasFailed()) {
      return;
    }

    if (typeof map[key] === 'function') {
      debug('`%s` can be flushed', key);
    } else {
      debug('Interupting flush: `%s` is not finished', key);
      complete = false;
    }
  });

  if (!complete) {
    debug('Not flushing: some files cannot be flushed');
    return;
  }

  fileSet.complete = {};

  fileSet.pipeline.run(fileSet, function (err) {
    debug('Flushing: all files can be flushed');

    /* Flush. */
    for (sourcePath in map) {
      map[sourcePath](err);
    }
  });
}
