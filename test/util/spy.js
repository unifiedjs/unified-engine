import {PassThrough} from 'stream'

export function spy() {
  const stream = new PassThrough()
  const output = []
  const originalWrite = stream.write

  stream.write = write

  done.stream = stream

  return done

  function write(chunk, encoding, callback) {
    callback = typeof encoding === 'function' ? encoding : callback

    if (typeof callback === 'function') {
      setImmediate(callback)
    }

    output.push(chunk)
  }

  function done() {
    stream.write = originalWrite

    return output.join('')
  }
}
