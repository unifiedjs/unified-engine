'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('settings', function(t) {
  t.plan(2)

  t.test('should use `settings`', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        settings: {alpha: true}
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function attacher() {
      st.deepEqual(this.data('settings'), {alpha: true}, 'should configure')

      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })

  t.test('should cascade `settings`', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: join(fixtures, 'config-settings-cascade'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        rcName: '.foorc',
        settings: {alpha: false, bravo: 'charlie'}
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function attacher() {
      st.deepEqual(
        this.data('settings'),
        {alpha: false, bravo: 'charlie', delta: 1},
        'should configure'
      )

      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })
})

test('plugins', function(t) {
  t.plan(3)

  t.test('should use `plugins` as list of functions', function(st) {
    var stderr = spy()

    st.plan(3)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [one, [two, {alpha: true}]]
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function one() {
      return transformerOne
    }

    function transformerOne() {
      st.pass('transformer')
    }

    function two(options) {
      return transformerTwo

      function transformerTwo() {
        st.deepEqual(options, {alpha: true}, 'transformer')
      }
    }
  })

  t.test('should use `plugins` as list of strings', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: ['./preset', ['./preset/plugin', {two: false, three: true}]]
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('should use `plugins` as list of objects', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: {
          './preset': null,
          './preset/plugin': {two: false, three: true}
        }
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function addTest() {
      this.t = st
    }
  })
})
