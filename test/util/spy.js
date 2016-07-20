/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* Dependencies. */
var PassThrough = require('stream').PassThrough;

/* Expose. */
module.exports = spy;

/**
 * Create a stream to spy on.
 */
function spy() {
  var stream = new PassThrough();
  var output = [];
  var write;

  write = stream.write;

  stream.write = function (chunk, encoding, callback) {
    callback = typeof encoding === 'function' ? encoding : callback;

    if (typeof callback === 'function') {
      setImmediate(callback);
    }

    output.push(chunk);
  };

  function done() {
    stream.write = write;

    return output.join('');
  }

  done.stream = stream;

  return done;
}
