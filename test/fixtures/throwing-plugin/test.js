/**
 * @type {import('unified').Plugin<Array<unknown>>}
 * @param {unknown} options
 */
module.exports = function (options) {
  if (options && typeof options === 'object' && 'required' in options) {
    // Fine
  } else {
    throw new Error('Missing `required`')
  }
}
