// @ts-expect-error: import for types in CJS works fine.
/** @typedef {import('unified').Processor} Processor */

const assert = require('node:assert/strict')

/**
 * @this {Processor}
 *   Processor.
 * @param {unknown} [options]
 *   Options.
 * @returns {undefined}
 *   Nothing.
 */
module.exports = function (options) {
  assert(typeof globalThis.unifiedEngineTestCalls === 'number')
  assert(globalThis.unifiedEngineTestValues)
  globalThis.unifiedEngineTestCalls++
  globalThis.unifiedEngineTestValues = {
    ...globalThis.unifiedEngineTestValues,
    defaultsOptions: options,
    defaultsSettings: this.data('settings')
  }
}
