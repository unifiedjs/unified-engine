/** @type {import('unified').Plugin<Array<unknown>>} */
export default function test() {
  /** @type {import('tape').Test} */
  // @ts-expect-error: hush.
  const t = this.t

  t.pass()
}
