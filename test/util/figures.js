'use strict'

var isWin = require('./isWin')

module.exports = Object.assign(getFigure, figures)

var main = {
  cross: '✖',
  warning: '⚠'
}

var win = {
  cross: '×',
  warning: '‼'
}

var figures = isWin ? win : main

function getFigure(name) {
  return figures[name]
}

