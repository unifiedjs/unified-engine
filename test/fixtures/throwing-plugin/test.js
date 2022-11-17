/**
 * @type {import('unified').Plugin<Array<unknown>>}
 * @param {unknown} options
 */
export default function throwingPlugin(options) {
  if (options && typeof options === 'object' && 'required' in options) {
    // Fine
  } else {
    throw new Error('Missing `required`')
  }
}
