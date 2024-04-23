/**
 * @typedef {import('unist').Literal} Literal
 * @typedef {import('unified').Processor<Literal>} ParseProcessor
 * @typedef {import('unified').Processor<undefined, undefined, undefined, Literal, string>} SerializeProcessor
 */

import {unified} from 'unified'

/**
 * Parser.
 *
 * @type {import('unified').Plugin<[], string, Literal>}
 */
function parse() {
  // @ts-expect-error: good.
  const self = /** @type {ParseProcessor} */ (this)

  self.parser = parser

  /**
   * @param {string} document
   * @returns {Literal}
   */
  function parser(document) {
    return {type: 'text', value: document}
  }
}

/**
 * Compiler.
 *
 * @type {import('unified').Plugin<[], Literal, string>}
 */
function stringify() {
  // @ts-expect-error: good.
  const self = /** @type {SerializeProcessor} */ (this)

  self.compiler = compiler

  /**
   * @param {Literal} tree
   * @returns {string}
   */
  function compiler(tree) {
    return String(tree.value)
  }
}

export const noop = unified().use(parse).use(stringify)
