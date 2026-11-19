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
   * Parse a document.
   *
   * @param {string} document
   *   Document.
   * @returns {Literal}
   *   Tree.
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
   * Serialize a tree.
   *
   * @param {Literal} tree
   *   Tree.
   * @returns {string}
   *   Document.
   */
  function compiler(tree) {
    return String(tree.value)
  }
}

export const noop = unified().use(parse).use(stringify)
