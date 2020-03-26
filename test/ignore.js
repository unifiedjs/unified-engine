'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('ignore', function (t) {
  t.plan(9)

  t.test('should fail fatally when given ignores are not found', function (t) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
    }
  })

  t.test('should support custom ignore files', function (t) {
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should support searching ignore files', function (t) {
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should not look into hidden files', function (t) {
    var stderr = spy()

    t.plan(1)

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
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }
  })

  t.test('should support no ignore files', function (t) {
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should support ignore patterns', function (t) {
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test('should support ignore files and ignore patterns', function (t) {
    var stderr = spy()

    t.plan(1)

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

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })

  t.test(
    '`ignorePath` should resolve from its directory, `ignorePatterns` from cwd',
    function (t) {
      var stderr = spy()

      t.plan(1)

      engine(
        {
          processor: noop,
          cwd: join(fixtures, 'sibling-ignore'),
          streamError: stderr.stream,
          files: ['.'],
          ignorePath: join('deep', 'ignore'),
          ignorePatterns: ['files/two.txt'],
          extensions: ['txt']
        },
        onrun
      )

      function onrun(error, code) {
        var expected = [
          'deep/files/two.txt: no issues found',
          'files/one.txt: no issues found',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    }
  )

  t.test('`ignoreFrom`', function (t) {
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'sibling-ignore'),
        streamError: stderr.stream,
        files: ['.'],
        ignorePath: join('deep', 'ignore'),
        ignorePatterns: ['files/two.txt'],
        ignoreFrom: '.',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        join('deep', 'files', 'one.txt') + ': no issues found',
        join('deep', 'files', 'two.txt') + ': no issues found',
        ''
      ].join('\n')

      t.deepEqual([error, code, stderr()], [null, 0, expected], 'should report')
    }
  })
})
