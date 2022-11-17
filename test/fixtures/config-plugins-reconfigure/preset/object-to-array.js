/** @param {unknown} options */
export default function objectToArray(options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.objectToArray = options
}
