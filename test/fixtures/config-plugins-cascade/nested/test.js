const assert = require('node:assert/strict')

module.exports = check

function check() {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
}
