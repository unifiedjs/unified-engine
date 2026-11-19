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
    const value = typeof encoding === 'function' ? encoding : callback

    if (typeof value === 'function') {
      setImmediate(value, undefined)
    }

    output.push(chunk)
    return true
  }

  done.chunks = output
  done.stream = stream

  return done

  function done() {
    stream.write = originalWrite
    return output
      .map(function (chunk) {
        return chunk instanceof Uint8Array
          ? new TextDecoder().decode(chunk)
          : chunk
      })
      .join('')
  }
}
