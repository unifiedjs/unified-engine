module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {
      nestedScript: true,
      cascade: 5
    },
    'should pass the correct options to plugin `test2`'
  );
}
