/**
 * @this {import('unified').Processor}
 * @type {import('unified').Plugin<Array<unknown>>}
 */
export default function plugin(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    {one: true, two: true},
    'should pass the correct options to the deep plugin'
  )
}
