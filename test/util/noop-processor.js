/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {unified} from 'unified'

/** @type {import('unified').Plugin<unknown[]>} */
function plug() {
  Object.assign(this, {
    /** @param {string} doc */
    Parser(doc) {
      return {type: 'text', value: doc}
    },
    /** @param {Literal} tree */
    Compiler(tree) {
      return tree.value
    }
  })
}

export const noop = unified().use(plug)
