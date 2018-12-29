'use strict'

var path = require('path')
var test = require('tape')
var strip = require('strip-ansi')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var figures = require('figures')
var platform = require('./util/platform')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

if (!platform.isWin) {
  /* https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93 */
  var original = process.env.CI

  process.env.CI = 'true'

  test.onFinish(function() {
    process.env.CI = original
  })
}

test('reporting', function(t) {
  t.plan(7)

  t.test('should fail for warnings with `frail`', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['one.txt'],
        frail: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [
          null,
          1,
          'one.txt\n  1:1  warning  Warning\n\n' +
            figures.warning +
            ' 1 warning\n'
        ],
        'should report'
      )
    }

    function warn() {
      return transformer
    }

    function transformer(tree, file) {
      file.message('Warning')
    }
  })

  t.test('should not report succesful files when `quiet` (#1)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: join(fixtures, 'two-files'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [
          null,
          0,
          'two.txt\n  1:1  warning  Warning\n\n' +
            figures.warning +
            ' 1 warning\n'
        ],
        'should report'
      )
    }

    function warn() {
      return transformer
    }

    function transformer(tree, file) {
      if (file.stem === 'two') {
        file.message('Warning')
      }
    }
  })

  t.test('should not report succesful files when `quiet` (#2)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop(),
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual([error, code, stderr()], [null, 0, ''], 'should not report')
    }
  })

  t.test('should not report succesful files when `silent`', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: join(fixtures, 'two-files'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        silent: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [
          null,
          1,
          'two.txt\n  1:1  error  Error\n\n' + figures.cross + ' 1 error\n'
        ],
        'should report'
      )
    }

    function warn() {
      return transformer
    }

    function transformer(tree, file) {
      file.message('Warning')

      if (file.stem === 'two') {
        file.fail('Error')
      }
    }
  })

  t.test('should support custom reporters (without prefix)', function(st) {
    var stderr = spy()
    var root = join(fixtures, 'two-files')

    st.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'json',
        reporterOptions: {
          pretty: true
        }
      },
      onrun
    )

    function onrun(error, code) {
      var report = JSON.stringify(
        [
          {
            path: 'one.txt',
            cwd: root,
            history: ['one.txt'],
            messages: []
          },
          {
            path: 'two.txt',
            cwd: root,
            history: ['two.txt'],
            messages: [
              {
                reason: 'Error',
                line: null,
                column: null,
                location: {
                  start: {line: null, column: null},
                  end: {line: null, column: null}
                },
                ruleId: null,
                source: null,
                fatal: true,
                stack: null
              }
            ]
          }
        ],
        null,
        2
      )

      st.deepEqual([error, code, stderr()], [null, 1, report + '\n'])
    }

    function warn() {
      return transformer
    }

    function transformer(tree, file) {
      if (file.stem === 'two') {
        file.fail('Error')
      }
    }
  })

  t.test('should support custom reporters (with prefix)', function(st) {
    var stderr = spy()
    var root = join(fixtures, 'two-files')

    st.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'vfile-reporter-pretty'
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, strip(stderr())],
        [
          null,
          0,
          '\n  one.txt\n  ' + figures.warning + '  Info!  \n\n  1 warning\n'
        ]
      )
    }

    function warn() {
      return transformer
    }

    function transformer(tree, file) {
      if (file.stem === 'one') {
        file.info('Info!')
      }
    }
  })

  t.test('should fail on an unfound reporter', function(st) {
    var root = join(fixtures, 'one-file')

    st.plan(1)

    engine(
      {
        processor: noop(),
        cwd: root,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'missing'
      },
      onrun
    )

    function onrun(error) {
      st.equal(error.message, 'Could not find reporter `missing`')
    }
  })
})
