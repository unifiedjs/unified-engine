module.exports = function () {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
}
