'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('configuration', function(t) {
  t.plan(13)

  t.test('should fail fatally when custom rc files are missing', function(st) {
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read given file `.foorc`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should fail fatally when custom rc files are empty', function(st) {
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse given file `.foorc`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should fail fatally when custom rc files are invalid', function(st) {
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 3)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse given file `.foorc.js`',
        'Error: Expected preset, not `false`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support `.rc.js` modules (1)', function(st) {
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `.foorc.js`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support `.rc.js` modules (2)', function(st) {
    var stderr = spy()

    st.plan(1)

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
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should support valid .rc modules'
      )
    }
  })

  t.test('should support `.rc.js` modules (3)', function(st) {
    var stderr = spy()

    st.plan(1)

    require('./fixtures/rc-module/.foorc') // eslint-disable-line import/no-unassigned-import

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
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should use Node’s module caching (coverage)'
      )
    }
  })

  t.test('should support `.rc.yaml` modules', function(st) {
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `.foorc.yaml`'
      ].join('\n')

      st.deepEqual(
        [error, code, actual],
        [null, 1, expected],
        'should fail fatally when custom .rc files are malformed'
      )
    }
  })

  t.test('should support custom rc files', function(st) {
    var stderr = spy()

    st.plan(1)

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

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should support searching package files', function(st) {
    var cwd = join(fixtures, 'malformed-package-file')
    var stderr = spy()

    st.plan(1)

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
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `package.json`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should support custom rc files', function(st) {
    var stderr = spy()

    st.plan(1)

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

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should support no config files', function(st) {
    var stderr = spy()

    st.plan(1)

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

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should not search if `detectConfig` is `false`', function(st) {
    var stderr = spy()

    st.plan(1)

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
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should not search for config if `detectConfig` is set to `false`'
      )
    }
  })

  t.test('should cascade `settings`', function(st) {
    var stderr = spy()

    st.plan(2)

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
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function plugin() {
      st.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })
})
