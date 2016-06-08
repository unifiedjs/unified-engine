/* eslint-env node */
module.exports = function (processor, options) {
    if (!options || !options.required) {
        throw new Error('Missing `required`');
    }
}
