/** @type {import('unified').Plugin} */
module.exports = function (options) {
  if (!options || !options.required) {
    throw new Error('Missing `required`')
  }
}
