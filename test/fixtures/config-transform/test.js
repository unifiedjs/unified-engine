module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {golf: false},
    'should pass the correct options to plugin `test`'
  );
}
