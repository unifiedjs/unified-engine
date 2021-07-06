/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unified').CompilerFunction} CompilerFunction
 * @typedef {import('unist').Literal} Literal
 */

import {unified} from 'unified'

// @ts-expect-error: unified types are wrong.
export const noop = unified().use(function () {
  /**
   * @type {ParserFunction}
   * @returns {Literal}
   */
  this.Parser = (doc) => {
    return {type: 'text', value: doc}
  }

  /**
   * @type {CompilerFunction}
   * @param {Literal} tree
   */
  // @ts-expect-error: fine.
  this.Compiler = (tree) => {
    return tree.value
  }
})
