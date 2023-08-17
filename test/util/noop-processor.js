/**
 * @typedef {import('unist').Literal} Literal
 */

import {unified} from 'unified'

/**
 * Parser.
 *
 * @type {import('unified').Plugin<[], string, Literal>}
 */
function parse() {
  /** @type {import('unified').Parser<Literal>} */
  this.parser = function (doc) {
    return {type: 'text', value: doc}
  }
}

/**
 * Compiler.
 *
 * @type {import('unified').Plugin<[], Literal, string>}
 */
function stringify() {
  /** @type {import('unified').Compiler<Literal, string>} */
  this.compiler = function (tree) {
    return String(tree.value)
  }
}

export const noop = unified().use(parse).use(stringify)
