/** @param {unknown} options */
export default function mergeObject(options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.mergeObject = options
}
