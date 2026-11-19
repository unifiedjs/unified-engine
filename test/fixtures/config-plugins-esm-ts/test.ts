import assert from 'node:assert/strict'

export default function test() {
  assert.ok(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
}
