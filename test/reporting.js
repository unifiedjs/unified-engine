/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {fileURLToPath} from 'node:url'
import process from 'node:process'
import test from 'tape'
import stripAnsi from 'strip-ansi'
import vfileReporterPretty from 'vfile-reporter-pretty'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

const windows = process.platform === 'win32'
const cross = windows ? '×' : '✖'
const danger = windows ? '‼' : '⚠'

if (!windows) {
  // See: <https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93>.
  const original = process.env.CI

  process.env.CI = 'true'

  test.onFinish(() => {
    process.env.CI = original
  })
}

test('reporting', (t) => {
  t.plan(8)

  t.test('should fail for warnings with `frail`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (_, file) => {
            file.message('Warning')
          }
        ),
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['one.txt'],
        frail: true
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [
            null,
            1,
            'one.txt\n  1:1  warning  Warning\n\n' + danger + ' 1 warning\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should not report succesful files when `quiet` (#1)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (_, file) => {
            if (file.stem === 'two') {
              file.message('Warning')
            }
          }
        ),
        cwd: new URL('two-files/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            'two.txt\n  1:1  warning  Warning\n\n' + danger + ' 1 warning\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should not report succesful files when `quiet` (#2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        quiet: true
      },
      (error, code) => {
        t.deepEqual([error, code, stderr()], [null, 0, ''], 'should not report')
      }
    )
  })

  t.test('should not report succesful files when `silent`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (_, file) => {
            file.message('Warning')

            if (file.stem === 'two') {
              file.fail('Error')
            }
          }
        ),
        cwd: new URL('two-files/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        silent: true
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 1, 'two.txt\n  1:1  error  Error\n\n' + cross + ' 1 error\n'],
          'should report'
        )
      }
    )
  })

  t.test('should support custom given reporters', (t) => {
    const stderr = spy()
    const root = fileURLToPath(new URL('two-files/', fixtures))

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: vfileReporterPretty
      },
      (error, code) => {
        t.deepEqual([error, code, stripAnsi(stderr())], [null, 0, ''])
      }
    )
  })

  t.test('should support custom reporters (without prefix)', (t) => {
    const stderr = spy()
    const root = fileURLToPath(new URL('two-files/', fixtures))

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (_, file) => {
            if (file.stem === 'two') {
              file.fail('Error')
            }
          }
        ),
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'json',
        reporterOptions: {
          pretty: true
        }
      },
      (error, code) => {
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
    )
  })

  t.test('should support custom reporters (with prefix)', (t) => {
    const stderr = spy()
    const root = fileURLToPath(new URL('two-files/', fixtures))

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (_, file) => {
            if (file.stem === 'one') {
              file.info('Info!')
            }
          }
        ),
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'vfile-reporter-pretty'
      },
      (error, code) => {
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
    )
  })

  t.test('should fail on an unfound reporter', (t) => {
    const root = fileURLToPath(new URL('one-file/', fixtures))

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: root,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'missing'
      },
      (error) => {
        t.equal(error && error.message, 'Could not find reporter `missing`')
      }
    )
  })
})
