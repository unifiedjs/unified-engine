import assert from 'node:assert/strict'

/**
 * @param {unknown} options
 *   Configuration.
 * @returns {undefined}
 *   Nothing.
 */
export default function plugin(options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = options
}
