/* eslint-env node */
module.exports = function (processor, options) {
    processor.t.deepEqual(
        options,
        undefined,
        'should pass `undefined` instead of null for es* default params'
    );
}
