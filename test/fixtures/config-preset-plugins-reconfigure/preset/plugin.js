module.exports = function (options) {
  this.t.deepEqual(
    options,
    {
      one: true,
      two: false,
      three: true
    },
    'should pass the correct options to the preset plugin'
  );
};
