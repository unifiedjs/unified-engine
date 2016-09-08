module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {
      script: true,
      package: ['foo', 'bar', 'baz'],
      nestedScript: true,
      cascade: 5
    },
    'should pass the correct options to plugin `test`'
  );
}
