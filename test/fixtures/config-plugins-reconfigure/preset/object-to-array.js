module.exports = function (options) {
  this.t.deepEqual(
    options,
    [2],
    'object-to-array: should pass the reconfigured array'
  )
}
