/**
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
export default function throwingPlugin(options) {
  if (options && typeof options === 'object' && 'required' in options) {
    // Fine
  } else {
    throw new Error('Missing `required`')
  }
}
