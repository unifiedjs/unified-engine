/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {unified} from 'unified'

/** @type {import('unified').Plugin<Array<void>, string, Literal>} */
function parse() {
  Object.assign(this, {
    /** @type {import('unified').ParserFunction<Literal>} */
    Parser(doc) {
      return {type: 'text', value: doc}
    }
  })
}

/** @type {import('unified').Plugin<Array<void>, Literal, string>} */
function stringify() {
  Object.assign(this, {
    /** @type {import('unified').CompilerFunction<Literal, string>} */
    Compiler(tree) {
      return tree.value
    }
  })
}

export const noop = unified().use(parse).use(stringify)
