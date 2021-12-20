/** @type {import('unified').Plugin<Array<unknown>>} */
module.exports = function () {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.pass()
}
