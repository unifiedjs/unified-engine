'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('`defaultConfig`', function(t) {
  t.plan(2)

  var defaultConfig = {
    settings: {alpha: true},
    plugins: {'./test-defaults': {bravo: false}}
  }

  t.test('should use default config if no config file is found', function(st) {
    var stderr = spy()

    st.plan(3)

    engine(
      {
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: join(fixtures, 'config-default'),
        files: ['.'],
        packageField: 'bar',
        extensions: ['txt'],
        defaultConfig: defaultConfig
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should work'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('should use found otherwise', function(st) {
    var stderr = spy()

    st.plan(3)

    engine(
      {
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: join(fixtures, 'config-default'),
        files: ['.'],
        packageField: 'foo',
        extensions: ['txt'],
        defaultConfig: defaultConfig
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should work'
      )
    }

    function addTest() {
      this.t = st
    }
  })
})
