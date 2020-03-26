module.exports = function (options) {
  this.t.deepEqual(
    options,
    [1],
    'string-to-array: should pass the reconfigured array'
  )
}
