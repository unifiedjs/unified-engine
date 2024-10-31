/**
 * @import {Literal} from 'unist'
 * @import {Plugin} from 'unified'
 * @import {VFile} from 'vfile'
 */

import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import process from 'node:process'
import test from 'node:test'
import {promisify} from 'node:util'
import stripAnsi from 'strip-ansi'
import vfileReporterPretty from 'vfile-reporter-pretty'
import {engine} from 'unified-engine'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)
const windows = process.platform === 'win32'

/**
 * @param {Array<VFile>} files
 *   Files.
 * @returns {Promise<string>}
 *   Report.
 */
const vfileReporterPrettyAsync = async function (files) {
  return vfileReporterPretty(files)
}

// See: <https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93>.
const original = process.env.CI

if (!windows) {
  process.env.CI = 'true'
}

test('reporting', async function (t) {
  await t.test('should fail for warnings with `frail`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      files: ['one.txt'],
      frail: true,
      processor: noop().use(
        /** @type {Plugin<[], Literal>} */
        function () {
          return function (_, file) {
            file.message('Warning')
          }
        }
      ),
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(stderr(), 'one.txt\n warning Warning\n\n⚠ 1 warning\n')
  })

  await t.test(
    'should not report succesful files when `quiet` (#1)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('two-files/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop().use(
          /** @type {Plugin<[], Literal>} */
          function () {
            return function (_, file) {
              if (file.stem === 'two') {
                file.message('Warning')
              }
            }
          }
        ),
        quiet: true,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'two.txt\n warning Warning\n\n⚠ 1 warning\n')
    }
  )

  await t.test(
    'should not report succesful files when `quiet` (#2)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('one-file/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop(),
        quiet: true,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), '')
    }
  )

  await t.test(
    'should not report succesful files when `silent`',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('two-files/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop().use(
          /** @type {Plugin<[], Literal>} */
          function () {
            return function (_, file) {
              file.message('Warning')

              if (file.stem === 'two') {
                file.fail('Error')
              }
            }
          }
        ),
        silent: true,
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(stderr(), 'two.txt\n error Error\n\n✖ 1 error\n')
    }
  )

  await t.test('should report extra info w/ `verbose`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(
        /** @type {Plugin<[], Literal>} */
        function () {
          return function (_, file) {
            const message = file.message('x')
            message.url = 'https://example.com'
            message.note = 'lorem ipsum'
          }
        }
      ),
      streamError: stderr.stream,
      verbose: true
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'one.txt',
        ' warning x',
        '  [url]:',
        '    https://example.com',
        '  [note]:',
        '    lorem ipsum',
        '',
        '⚠ 1 warning',
        ''
      ].join('\n')
    )
  })

  await t.test('should support custom given reporters', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('two-files/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop(),
      reporter: vfileReporterPretty,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '')
  })

  await t.test('should support async reporters', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('two-files/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop(),
      reporter: vfileReporterPrettyAsync,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '')
  })

  await t.test(
    'should support custom reporters (without prefix)',
    async function () {
      const stderr = spy()
      const cwd = new URL('two-files/', fixtures)

      const code = await run({
        cwd,
        extensions: ['txt'],
        files: ['.'],
        processor: noop().use(
          /** @type {Plugin<[], Literal>} */
          function () {
            return function (_, file) {
              if (file.stem === 'two') {
                file.fail('Error')
              }
            }
          }
        ),
        reporter: 'json',
        reporterOptions: {pretty: true},
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        stderr(),
        JSON.stringify(
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
              messages: [{fatal: true, reason: 'Error'}]
            }
          ],
          undefined,
          2
        ) + '\n'
      )
    }
  )

  await t.test(
    'should support custom reporters (with prefix)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('two-files/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop().use(
          /** @type {Plugin<[], Literal>} */
          function () {
            return function (_, file) {
              if (file.stem === 'one') {
                file.info('Info!')
              }
            }
          }
        ),
        reporter: 'vfile-reporter-pretty',
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stripAnsi(stderr()),
        '\n  one.txt\n  ⚠  Info!  \n\n  1 warning\n'
      )
    }
  )

  await t.test('should fail on an unfound reporter', async function () {
    try {
      await run({
        cwd: new URL('one-file/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop(),
        reporter: 'missing'
      })
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Cannot find reporter `missing`/)
    }
  })

  if (!windows) {
    process.env.CI = original
  }
})
