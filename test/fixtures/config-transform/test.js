/** @type {import('unified').Plugin<unknown[]>} */
module.exports = function (options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    {golf: false},
    'should pass the correct options to plugin `test`'
  )
}
