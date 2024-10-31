import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from 'unified-engine'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)
const run = promisify(engine)

test('configuration (plugins)', async function (t) {
  await t.test('should cascade `plugins`', async function () {
    const stderr = spy()

    globalThis.unifiedEngineTestCalls = 0

    const code = await run({
      cwd: new URL('config-plugins-cascade/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop(),
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'nested' + path.sep + 'one.txt: no issues found\n')
    assert.equal(globalThis.unifiedEngineTestCalls, 1)
  })

  await t.test(
    'should support an ESM plugin w/ an `.mjs` extname',
    async function () {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0

      const code = await run({
        cwd: new URL('config-plugins-esm-mjs/', fixtures),
        files: ['one.txt'],
        processor: noop(),
        rcName: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(globalThis.unifiedEngineTestCalls, 1)
    }
  )

  await t.test(
    'should support an ESM plugin w/ a `.js` extname',
    async function () {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0

      const code = await run({
        cwd: new URL('config-plugins-esm-js/', fixtures),
        files: ['one.txt'],
        processor: noop(),
        rcName: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(globalThis.unifiedEngineTestCalls, 1)
    }
  )

  await t.test('should handle failing plugins', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('malformed-plugin/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `package.json`'
      ].join('\n')
    )
  })

  await t.test('should handle plugins w/o `export default`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('plugin-without-default/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `package.json`'
      ].join('\n')
    )
  })

  await t.test('should handle missing plugins', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('missing-plugin/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot find module `missing`'
      ].join('\n')
    )
  })

  await t.test('should handle invalid plugins', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('not-a-plugin/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `package.json`'
      ].join('\n')
    )
  })

  await t.test('should handle throwing plugins', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('throwing-plugin/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Missing `required`'
      ].join('\n')
    )
  })

  await t.test('should handle injected plugins', async function () {
    const stderr = spy()
    const o = {foo: 'bar'}
    let calls = 0

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        // Plugin.
        function (options) {
          calls++
          assert.equal(options, undefined)
        },
        // Tuple.
        [
          function (options) {
            calls++
            assert.equal(options, o)
          },
          o
        ]
      ],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 2)
  })
})
