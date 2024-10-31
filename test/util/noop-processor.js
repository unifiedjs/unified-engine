/**
 * @import {Literal} from 'unist'
 * @import {Plugin, Processor} from 'unified'
 */

import {unified} from 'unified'

/**
 * Parser.
 *
 * @type {Plugin<[], string, Literal>}
 */
function parse() {
  // @ts-expect-error: good.
  const self = /** @type {Processor<Literal>} */ (this)

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
 * @type {Plugin<[], Literal, string>}
 */
function stringify() {
  const self =
    // @ts-expect-error: good.
    /** @type {Processor<undefined, undefined, undefined, Literal, string>} */ (
      this
    )

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
