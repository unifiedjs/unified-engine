import {PassThrough} from 'node:stream'

export function spy() {
  /** @type {Array<unknown>} */
  const output = []
  const stream = new PassThrough()
  const originalWrite = stream.write

  /**
   * Write method.
   *
   * @type {PassThrough['write']}
   * @param {unknown} chunk
   *   Thing.
   * @returns {boolean}
   *   Whether the write was succesful (yes).
   */
  // @ts-expect-error: TS can’t apply overloads I think?.
  stream.write = function (chunk, encoding, callback) {
    const cb = typeof encoding === 'function' ? encoding : callback

    if (typeof cb === 'function') {
      setImmediate(cb, undefined)
    }

    output.push(chunk)
    return true
  }

  done.stream = stream

  return done

  function done() {
    stream.write = originalWrite
    return output.join('')
  }
}
