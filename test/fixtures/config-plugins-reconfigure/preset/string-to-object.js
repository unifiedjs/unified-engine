module.exports = function (options) {
  this.t.deepEqual(
    options,
    {bravo: 1},
    'string-to-object: should pass the reconfigured object'
  )
}
