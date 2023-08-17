const assert = require('node:assert/strict')

/**
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
module.exports = function (options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = options
}
