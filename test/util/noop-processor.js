'use strict'

var unified = require('unified')

module.exports = unified().use(add)

function add() {
  this.Parser = parser
  this.Compiler = compiler

  function parser(doc) {
    return {type: 'text', value: doc}
  }

  function compiler(tree) {
    return tree.value
  }
}
