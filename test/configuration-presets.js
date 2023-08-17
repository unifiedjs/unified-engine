import assert from 'node:assert/strict'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)
const run = promisify(engine)

test('configuration-presets', async function (t) {
  await t.test('should fail on invalid `presets`', async function () {
    const root = new URL('config-presets-invalid/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd: root,
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      streamError: stderr.stream,
      rcName: '.foorc'
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `.foorc`'
      ].join('\n')
    )
  })

  await t.test(
    'should pass the correct options to the local and deep plugins',
    async function () {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0
      globalThis.unifiedEngineTestValues = {}

      const code = await run({
        cwd: new URL('config-presets-local/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop(),
        rcName: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(globalThis.unifiedEngineTestCalls, 2)

      assert.deepEqual(
        globalThis.unifiedEngineTestValues,
        {deep: {one: true, two: true}, local: {three: true, two: false}},
        'should pass the correct options to the local and deep plugins'
      )
    }
  )

  await t.test('should handle missing plugins in presets', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('config-presets-missing-plugin/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot find module `./plugin.js`'
      ].join('\n')
    )
  })

  await t.test('should reconfigure plugins', async function () {
    const stderr = spy()

    globalThis.unifiedEngineTestCalls = 0
    globalThis.unifiedEngineTestValues = {}

    const code = await run({
      cwd: new URL('config-plugins-reconfigure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop(),
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(globalThis.unifiedEngineTestCalls, 5)
    assert.deepEqual(globalThis.unifiedEngineTestValues, {
      arrayToObject: {delta: 1},
      mergeObject: {one: true, three: true, two: false},
      objectToArray: [2],
      stringToArray: [1],
      stringToObject: {bravo: 1}
    })
  })

  await t.test('should reconfigure imported plugins', async function () {
    const stderr = spy()

    globalThis.unifiedEngineTestCalls = 0
    globalThis.unifiedEngineTestValues = {}

    const code = await run({
      cwd: new URL('config-preset-plugins-reconfigure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop(),
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(globalThis.unifiedEngineTestCalls, 1)
    assert.deepEqual(globalThis.unifiedEngineTestValues, {
      one: true,
      three: true,
      two: false
    })
  })

  await t.test('should reconfigure: turn plugins off', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('config-plugins-reconfigure-off/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
  })

  await t.test('should reconfigure settings', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('config-settings-reconfigure-a/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(function () {
        assert.deepEqual(
          this.data('settings'),
          {alpha: true},
          'should configure'
        )
        calls++
      }),
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
  })

  await t.test('should reconfigure settings (2)', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('config-settings-reconfigure-b/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(function () {
        assert.deepEqual(
          this.data('settings'),
          {alpha: true},
          'should configure'
        )
        calls++
      }),
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
  })
})
