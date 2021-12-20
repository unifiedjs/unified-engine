/** @type {import('unified').Plugin<Array<unknown>>} */
export default function objectToArray(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    [2],
    'object-to-array: should pass the reconfigured array'
  )
}
