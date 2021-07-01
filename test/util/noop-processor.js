import unified from 'unified'

const noop = unified().use(add)

export default noop

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
