// @ts-expect-error: TS 4.9 is wrong.
/** @type {import('unified').Plugin<Array<unknown>>} */
module.exports = function (options) {
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestCalls++
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.defaultsSettings = this.data('settings')
  // @ts-expect-error: set by tests.
  globalThis.unifiedEngineTestValues.defaultsOptions = options
}
