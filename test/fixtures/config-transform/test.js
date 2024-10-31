const assert = require('node:assert/strict')

module.exports = check

/**
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
function check(options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = options
}
