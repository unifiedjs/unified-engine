/** @param {unknown} options */
export default function stringToObject(options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.stringToObject = options
}
