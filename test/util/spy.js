import {PassThrough} from 'stream'

export function spy() {
  const stream = new PassThrough()
  /** @type {string[]} */
  const output = []
  const originalWrite = stream.write

  /**
   * @param {string} chunk
   * @param {BufferEncoding|undefined} [encoding]
   * @param {((error: Error|null|undefined) => void)|undefined} [callback]
   */
  // @ts-expect-error: hush.
  stream.write = (chunk, encoding, callback) => {
    callback = typeof encoding === 'function' ? encoding : callback

    if (typeof callback === 'function') {
      setImmediate(callback)
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
