'use strict';

var unified = require('unified');

module.exports = unified()
  .use(function (processor) {
    processor.Parser = function (file) {
      this.value = file.toString();
    };

    processor.Parser.prototype.parse = function () {
      return {type: 'text', value: this.value};
    };
  })
  .use(function (processor) {
    processor.Compiler = function () {};

    processor.Compiler.prototype.compile = function (tree) {
      return tree.value;
    };
  });
