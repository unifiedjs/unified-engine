import path from 'path'
import test from 'tape'
import stripAnsi from 'strip-ansi'
import figures from 'figures'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {windows} from './util/platform.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

if (!windows) {
  // See: <https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93>.
  const original = process.env.CI

  process.env.CI = 'true'

  test.onFinish(() => {
    process.env.CI = original
  })
}

test('reporting', (t) => {
  t.plan(7)

  t.test('should fail for warnings with `frail`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['one.txt'],
        frail: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
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

    function transformer(_, file) {
      file.message('Warning')
    }
  })

  t.test('should not report succesful files when `quiet` (#1)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: path.join(fixtures, 'two-files'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
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

    function transformer(_, file) {
      if (file.stem === 'two') {
        file.message('Warning')
      }
    }
  })

  t.test('should not report succesful files when `quiet` (#2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual([error, code, stderr()], [null, 0, ''], 'should not report')
    }
  })

  t.test('should not report succesful files when `silent`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(warn),
        cwd: path.join(fixtures, 'two-files'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        silent: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
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

    function transformer(_, file) {
      file.message('Warning')

      if (file.stem === 'two') {
        file.fail('Error')
      }
    }
  })

  t.test('should support custom reporters (without prefix)', (t) => {
    const stderr = spy()
    const root = path.join(fixtures, 'two-files')

    t.plan(1)

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
      const report = JSON.stringify(
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
                position: {
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

      t.deepEqual([error, code, stderr()], [null, 1, report + '\n'])
    }

    function warn() {
      return transformer
    }

    function transformer(_, file) {
      if (file.stem === 'two') {
        file.fail('Error')
      }
    }
  })

  t.test('should support custom reporters (with prefix)', (t) => {
    const stderr = spy()
    const root = path.join(fixtures, 'two-files')

    t.plan(1)

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
      t.deepEqual(
        [error, code, stripAnsi(stderr())],
        [
          null,
          0,
          // Note: `vfile-reporter-pretty` returns `⚠` on Windows too.
          '\n  one.txt\n  ⚠  Info!  \n\n  1 warning\n'
        ]
      )
    }

    function warn() {
      return transformer
    }

    function transformer(_, file) {
      if (file.stem === 'one') {
        file.info('Info!')
      }
    }
  })

  t.test('should fail on an unfound reporter', (t) => {
    const root = path.join(fixtures, 'one-file')

    t.plan(1)

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
      t.equal(error.message, 'Could not find reporter `missing`')
    }
  })
})
