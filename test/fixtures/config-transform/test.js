module.exports = function(options) {
  this.t.deepEqual(
    options,
    {golf: false},
    'should pass the correct options to plugin `test`'
  )
}
