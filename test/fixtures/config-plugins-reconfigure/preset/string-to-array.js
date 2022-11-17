/** @param {unknown} options */
export default function stringToArray(options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.stringToArray = options
}
