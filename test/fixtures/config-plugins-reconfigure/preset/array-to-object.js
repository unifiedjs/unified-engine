module.exports = function (options) {
  this.t.deepEqual(
    options,
    {delta: 1},
    'array-to-object: should pass the reconfigured object'
  )
}
