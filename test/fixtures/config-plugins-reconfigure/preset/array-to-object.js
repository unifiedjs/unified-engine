import assert from 'node:assert/strict'

/**
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
export default function arrayToObject(options) {
  assert.ok(typeof globalThis.unifiedEngineTestCalls === 'number')
  assert.ok(globalThis.unifiedEngineTestValues)
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = {
    ...globalThis.unifiedEngineTestValues,
    arrayToObject: options
  }
}
