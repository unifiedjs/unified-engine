module.exports = function(options) {
  this.t.deepEqual(
    this.data('settings'),
    {alpha: true},
    'should set the correct configuration'
  )
  this.t.deepEqual(
    options,
    {bravo: false},
    'should pass the correct options to plugin `test-defaults`'
  )
}
