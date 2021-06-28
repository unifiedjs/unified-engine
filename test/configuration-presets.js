'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor.js')
var spy = require('./util/spy.js')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('configuration-presets', function (t) {
  t.plan(8)

  t.test('should fail on invalid `presets`', function (t) {
    var root = join(fixtures, 'config-presets-invalid')
    var stderr = spy()

    t.plan(1)

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

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 3).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `.foorc`',
        'Expected a list or object of plugins, not `./preset`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support plugins with the same name', function (t) {
    var stderr = spy()

    // More assertions are in loaded plugins.
    t.plan(3)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = t
    }
  })

  t.test('should handle missing plugins in presets', function (t) {
    var stderr = spy()

    t.plan(1)

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

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Could not find module `./plugin`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should succeed')
    }
  })

  t.test('should reconfigure plugins', function (t) {
    var stderr = spy()

    // Five more assertions are loaded in the plugin.
    t.plan(6)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = t
    }
  })

  t.test('should reconfigure required plugins', function (t) {
    var stderr = spy()

    // One more assertion is loaded in the plugin.
    t.plan(2)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = t
    }
  })

  t.test('Should reconfigure: turn plugins off', function (t) {
    var stderr = spy()

    // More assertions are in loaded plugins.
    t.plan(1)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }
  })

  t.test('should reconfigure settings', function (t) {
    var stderr = spy()

    t.plan(2)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function attacher() {
      this.Parser = parser
      t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })

  t.test('should reconfigure settings (2)', function (t) {
    var stderr = spy()

    t.plan(2)

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

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function attacher() {
      t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })
})
