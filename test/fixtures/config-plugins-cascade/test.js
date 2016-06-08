/* eslint-env node */
module.exports = function (processor, options) {
    processor.t.deepEqual(
        options,
        {
            'module': true,
            'package': ['foo', 'bar', 'baz'],
            'nested-module': true,
            'cascade': 5
        },
        'should pass the correct options to plugin `test`'
    );
}
