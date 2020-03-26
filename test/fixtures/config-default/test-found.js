module.exports = function (options) {
  this.t.deepEqual(
    this.data('settings'),
    {charlie: true},
    'should set the correct configuration'
  )
  this.t.deepEqual(
    options,
    {delta: false},
    'should pass the correct options to plugin `test-found`'
  )
}
