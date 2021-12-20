import {PassThrough} from 'node:stream'

export function spy() {
  const stream = new PassThrough()
  /** @type {Array<string>} */
  const output = []
  const originalWrite = stream.write

  /**
   * @param {string} chunk
   */
  // @ts-expect-error: hush.
  stream.write = (chunk, encoding, callback) => {
    callback = typeof encoding === 'function' ? encoding : callback

    if (typeof callback === 'function') {
      setImmediate(callback, undefined)
    }

    output.push(chunk)
  }

  done.stream = stream

  return done

  function done() {
    stream.write = originalWrite

    return output.join('')
  }
}
