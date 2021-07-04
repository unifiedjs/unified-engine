/** @type {import('unified').Plugin} */
export default function stringToArray(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    [1],
    'string-to-array: should pass the reconfigured array'
  )
}
