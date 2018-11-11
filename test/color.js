'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('color', function(t) {
  var stderr = spy()

  t.plan(1)

  engine(
    {
      processor: noop,
      cwd: join(fixtures, 'empty'),
      streamError: stderr.stream,
      files: ['readme.md'],
      color: true
    },
    onrun
  )

  function onrun(error, code) {
    var expected = [
      '\u001B[4m\u001B[31mreadme.md\u001B[39m\u001B[24m',
      '  1:1  \u001B[31merror\u001B[39m  No such file or directory',
      '',
      '\u001B[31m✖\u001B[39m 1 error',
      ''
    ].join('\n')

    t.deepEqual(
      [error, code, stderr()],
      [null, 1, expected],
      'should support color'
    )
  }
})
