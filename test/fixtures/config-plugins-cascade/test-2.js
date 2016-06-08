/* eslint-env node */
module.exports = function (processor, options) {
    processor.t.deepEqual(
        options,
        {
            'nested-module': true,
            'cascade': 5
        },
        'should pass the correct options to plugin `test-2`'
    );
}
