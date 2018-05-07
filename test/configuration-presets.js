'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('configuration-presets', function(t) {
  t.plan(8)

  t.test('should fail on invalid `presets`', function(st) {
    var root = join(fixtures, 'config-presets-invalid')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 3)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `.foorc`',
        'Expected a list or object of plugins, not `./preset`'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support plugins with the same name', function(st) {
    var stderr = spy()

    /* More assertions are in loaded plugins. */
    st.plan(3)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-presets-local'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('should handle missing plugins in presets', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'config-presets-missing-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Could not find module `./plugin`'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should succeed')
    }
  })

  t.test('should reconfigure plugins', function(st) {
    var stderr = spy()

    /* One more assertion is loaded in the plugin. */
    st.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('should reconfigure required plugins', function(st) {
    var stderr = spy()

    /* One more assertion is loaded in the plugin. */
    st.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-preset-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('Should reconfigure: turn plugins off', function(st) {
    var stderr = spy()

    /* More assertions are in loaded plugins. */
    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'config-plugins-reconfigure-off'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }
  })

  t.test('should reconfigure settings', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: join(fixtures, 'config-settings-reconfigure-a'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function attacher() {
      this.Parser = parser
      st.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })

  t.test('should reconfigure settings (2)', function(st) {
    var stderr = spy()

    st.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: join(fixtures, 'config-settings-reconfigure-b'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
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
})
