/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import process from 'node:process'
import test from 'node:test'
import stripAnsi from 'strip-ansi'
import vfileReporterPretty from 'vfile-reporter-pretty'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

const windows = process.platform === 'win32'
const cross = windows ? '×' : '✖'
const danger = windows ? '‼' : '⚠'

/** @type {import('unified-engine').VFileReporter} */
const vfileReporterPrettyAsync = async (files) => vfileReporterPretty(files)

// See: <https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93>.
const original = process.env.CI

if (!windows) {
  process.env.CI = 'true'
}

test('reporting', async () => {
  await new Promise((resolve) => {
    const stderr = spy()

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
        assert.deepEqual(
          [error, code, stderr()],
          [
            null,
            1,
            'one.txt\n  1:1  warning  Warning\n\n' + danger + ' 1 warning\n'
          ],
          'should fail for warnings with `frail`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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
        assert.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            'two.txt\n  1:1  warning  Warning\n\n' + danger + ' 1 warning\n'
          ],
          'should not report succesful files when `quiet` (#1)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, ''],
          'should not report succesful files when `quiet` (#2)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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
        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, 'two.txt\n  1:1  error  Error\n\n' + cross + ' 1 error\n'],
          'should not report succesful files when `silent`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop(),
        cwd: new URL('two-files/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: vfileReporterPretty
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stripAnsi(stderr())],
          [null, 0, ''],
          'should support custom given reporters'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop(),
        cwd: new URL('two-files/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: vfileReporterPrettyAsync
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stripAnsi(stderr())],
          [null, 0, ''],
          'should support async reporters'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = new URL('two-files/', fixtures)

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
        cwd,
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
              cwd: fileURLToPath(cwd),
              history: ['one.txt'],
              messages: []
            },
            {
              path: 'two.txt',
              cwd: fileURLToPath(cwd),
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

        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, report + '\n'],
          'should support custom reporters (without prefix)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = new URL('two-files/', fixtures)

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
        cwd,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        reporter: 'vfile-reporter-pretty'
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stripAnsi(stderr())],
          [
            null,
            0,
            // Note: `vfile-reporter-pretty` returns `⚠` on Windows too.
            '\n  one.txt\n  ⚠  Info!  \n\n  1 warning\n'
          ],
          'should support custom reporters (with prefix)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    engine(
      {
        processor: noop(),
        cwd: new URL('one-file/', fixtures),
        files: ['.'],
        extensions: ['txt'],
        reporter: 'missing'
      },
      (error) => {
        assert.equal(
          error && error.message,
          'Could not find reporter `missing`',
          'should fail on an unfound reporter'
        )
        resolve(undefined)
      }
    )
  })

  if (!windows) {
    process.env.CI = original
  }
})
