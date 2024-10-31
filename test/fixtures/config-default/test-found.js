// @ts-expect-error: import for types in CJS works fine.
/** @import {Processor} from 'unified' */

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
    foundOptions: options,
    foundSettings: this.data('settings')
  }
}
