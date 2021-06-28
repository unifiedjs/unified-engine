'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor.js')
var spy = require('./util/spy.js')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('configuration', function (t) {
  t.plan(13)

  t.test('should fail fatally when custom rc files are missing', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'one-file'),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read given file `.foorc`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should fail fatally when custom rc files are empty', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'malformed-rc-empty'),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse given file `.foorc`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should fail fatally when custom rc files are invalid', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'malformed-rc-invalid'),
        files: ['.'],
        rcPath: '.foorc.js',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 3).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse given file `.foorc.js`',
        'Error: Expected preset, not `false`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support `.rc.js` modules (1)', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'malformed-rc-module'),
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
        '  1:1  error  Error: Cannot parse file `.foorc.js`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support `.rc.js` modules (2)', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'rc-module'),
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
        'should support valid .rc modules'
      )
    }
  })

  t.test('should support `.rc.js` modules (3)', function (t) {
    var stderr = spy()

    t.plan(1)

    require('./fixtures/rc-module/.foorc.js') // eslint-disable-line import/no-unassigned-import

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'rc-module'),
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
        'should use Node’s module caching (coverage)'
      )
    }
  })

  t.test('should support `.rc.yaml` modules', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'malformed-rc-yaml'),
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
        '  1:1  error  Error: Cannot parse file `.foorc.yaml`'
      ].join('\n')

      t.deepEqual(
        [error, code, actual],
        [null, 1, expected],
        'should fail fatally when custom .rc files are malformed'
      )
    }
  })

  t.test('should support custom rc files', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'rc-file'),
        streamError: stderr.stream,
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested' + path.sep + 'four.txt: no issues found',
        'nested' + path.sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        'two.txt: no issues found',
        ''
      ].join('\n')

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should support searching package files', function (t) {
    var cwd = join(fixtures, 'malformed-package-file')
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `package.json`'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should support custom rc files', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'rc-file'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested' + path.sep + 'four.txt: no issues found',
        'nested' + path.sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        'two.txt: no issues found',
        ''
      ].join('\n')

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should support no config files', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'simple-structure'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested' + path.sep + 'three.txt: no issues found',
        'nested' + path.sep + 'two.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should not search if `detectConfig` is `false`', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'malformed-rc-module'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        detectConfig: false,
        rcName: '.foorc'
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should not search for config if `detectConfig` is set to `false`'
      )
    }
  })

  t.test('should cascade `settings`', function (t) {
    var stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(plugin),
        cwd: join(fixtures, 'config-settings'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function plugin() {
      t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })
})
