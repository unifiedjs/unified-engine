/**
 * @typedef {import('unist').Literal} Literal
 */

import {unified} from 'unified'

/**
 * @type {import('unified').Plugin<[], string, Literal>}
 */
function parse() {
  /** @type {import('unified').Parser<Literal>} */
  this.Parser = function (doc) {
    return {type: 'text', value: doc}
  }
}

/**
 * @type {import('unified').Plugin<[], Literal, string>}
 */
function stringify() {
  /** @type {import('unified').Compiler<Literal, string>} */
  this.Compiler = function (tree) {
    return String(tree.value)
  }
}

export const noop = unified().use(parse).use(stringify)
