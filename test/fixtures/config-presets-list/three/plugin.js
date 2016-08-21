module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {
      alpha: true,
      bravo: false,
      charlie: true,
      delta: true
    },
    'should pass the correct options to the preset plugin'
  );
};
