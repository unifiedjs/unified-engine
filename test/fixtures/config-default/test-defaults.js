// @ts-expect-error: TS 4.9 is wrong.
/** @type {import('unified').Plugin<Array<unknown>>} */
module.exports = function (options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    this.data('settings'),
    {alpha: true},
    'should set the correct configuration'
  )
  t.deepEqual(
    options,
    {bravo: false},
    'should pass the correct options to plugin `test-defaults`'
  )
}
