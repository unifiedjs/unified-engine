'use strict';

var PassThrough = require('stream').PassThrough;

module.exports = spy;

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
