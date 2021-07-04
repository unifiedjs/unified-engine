/** @type {import('unified').Plugin} */
module.exports = function (options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    this.data('settings'),
    {charlie: true},
    'should set the correct configuration'
  )
  t.deepEqual(
    options,
    {delta: false},
    'should pass the correct options to plugin `test-found`'
  )
}
