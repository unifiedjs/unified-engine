module.exports = function (processor, options) {
  processor.t.deepEqual(
    options,
    {
      options: 'for',
      the: 'preset'
    },
    'should pass the correct options to the preset plugin'
  );
};
