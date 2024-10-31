// @ts-expect-error: import for types in CJS works fine.
/** @typedef {import('unified').Processor} Processor */

const assert = require('node:assert/strict')

module.exports = check

/**
 * @this {Processor}
 *   Processor.
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
function check(options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  assert(globalThis.unifiedEngineTestValues)
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = {
    ...globalThis.unifiedEngineTestValues,
    defaultsOptions: options,
    defaultsSettings: this.data('settings')
  }
}
