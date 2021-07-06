/**
 * @type {import('unified').Plugin}
 * @param {unknown} options
 */
module.exports = function (options) {
  if (options && typeof options === 'object' && 'required' in options) {
    // Fine
  } else {
    throw new Error('Missing `required`')
  }
}
