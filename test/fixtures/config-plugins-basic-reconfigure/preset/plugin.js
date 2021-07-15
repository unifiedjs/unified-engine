/** @type {import('unified').Plugin<unknown[]>} */
export default function plugin(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    {
      one: true,
      two: false,
      three: true
    },
    'should pass the correct options to the preset plugin'
  )
}
