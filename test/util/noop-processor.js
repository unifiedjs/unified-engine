/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {unified} from 'unified'

/**
 * @type {import('unified').Plugin<Array<void>, string, Literal>}
 */
function parse() {
  /** @type {import('unified').ParserFunction<Literal>} */
  this.Parser = function (doc) {
    return {type: 'text', value: doc}
  }
}

/**
 * @type {import('unified').Plugin<Array<void>, Literal, string>}
 */
function stringify() {
  /** @type {import('unified').CompilerFunction<Literal, string>} */
  this.Compiler = function (tree) {
    return tree.value
  }
}

// @ts-expect-error: `parse` is fine.
export const noop = unified().use(parse).use(stringify)
