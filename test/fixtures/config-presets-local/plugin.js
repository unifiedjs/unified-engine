import assert from 'node:assert/strict'

/**
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
export default function plugin(options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  assert(globalThis.unifiedEngineTestValues)
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = {
    ...globalThis.unifiedEngineTestValues,
    local: options
  }
}
