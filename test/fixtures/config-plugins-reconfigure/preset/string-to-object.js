/** @type {import('unified').Plugin} */
export default function stringToObject(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    {bravo: 1},
    'string-to-object: should pass the reconfigured object'
  )
}
