/** @param {unknown} options */
module.exports = function (options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues = options
}
