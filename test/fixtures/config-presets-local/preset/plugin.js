module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {one: true, two: true},
    'should pass the correct options to the deep plugin'
  );
};
