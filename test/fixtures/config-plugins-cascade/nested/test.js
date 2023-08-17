const assert = require('node:assert/strict')

module.exports = function () {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
}
