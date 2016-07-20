module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    undefined,
    'should pass `undefined` instead of `{}` for es* default params'
  );
}
