import assert from 'node:assert/strict'

export default function test() {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
}
