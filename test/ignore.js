'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('ignore', function (t) {
  t.plan(7)

  t.test('should fail fatally when given ignores are not found', function (st) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        files: ['one.txt'],
        detectIgnore: false,
        ignorePath: '.missing-ignore',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read given file `.missing-ignore`'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support custom ignore files', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: false,
        ignorePath: '.fooignore',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested' + path.sep + 'three.txt: no issues found',
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

  t.test('should support searching ignore files', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested' + path.sep + 'three.txt: no issues found',
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

  t.test('should not look into hidden files', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'hidden-directory'),
        streamError: stderr.stream,
        files: ['.'],
        // No `ignoreName`.
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
  })

  t.test('should support no ignore files', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'simple-structure'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
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

  t.test('should support ignore patterns', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'simple-structure'),
        streamError: stderr.stream,
        files: ['.'],
        ignorePatterns: ['**/t*.*'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = ['one.txt: no issues found', ''].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should support ignore files and ignore patterns', function (st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        ignorePatterns: ['nested'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = ['one.txt: no issues found', ''].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })
})
