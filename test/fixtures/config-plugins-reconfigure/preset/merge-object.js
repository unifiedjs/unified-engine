/** @type {import('unified').Plugin<unknown[]>} */
export default function mergeObject(options) {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.deepEqual(
    options,
    {one: true, two: false, three: true},
    'merge-object: should pass the merged object'
  )
}
