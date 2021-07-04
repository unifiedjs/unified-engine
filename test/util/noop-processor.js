/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unified').CompilerFunction} CompilerFunction
 */

import unified from 'unified'

// @ts-expect-error: unified types are wrong.
export const noop = unified().use(function () {
  /** @type {ParserFunction} */
  this.Parser = (doc) => {
    return {type: 'text', value: doc}
  }

  /** @type {CompilerFunction} */
  this.Compiler = (tree) => {
    // @ts-expect-error: fine.
    return tree.value
  }
})
