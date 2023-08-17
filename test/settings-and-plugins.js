/**
 * @typedef {import('unist').Literal} Literal
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('settings', async function (t) {
  await t.test('should use `settings`', async function () {
    const stderr = spy()
    let called = false

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(function () {
        assert.deepEqual(
          this.data('settings'),
          {alpha: true},
          'should configure'
        )
        called = true
      }),
      settings: {alpha: true},
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(called, true)
  })

  await t.test('should cascade `settings`', async function () {
    const stderr = spy()
    let called = false

    const code = await run({
      cwd: new URL('config-settings-cascade/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(function () {
        assert.deepEqual(
          this.data('settings'),
          {alpha: false, bravo: 'charlie', delta: 1},
          'should configure'
        )
        called = true
      }),
      rcName: '.foorc',
      settings: {alpha: false, bravo: 'charlie'},
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(called, true)
  })
})

test('plugins', async function (t) {
  await t.test('should use `plugins` as list of functions', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        function () {
          return function () {
            calls++
          }
        },
        [
          /**
           * @param {unknown} options
           *   Configuration.
           * @returns
           *   Transform.
           */
          function (options) {
            return function () {
              assert.deepEqual(options, {alpha: true}, 'transformer')
              calls++
            }
          },
          {alpha: true}
        ]
      ],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 2)
  })

  await t.test('should use `plugins` as list of strings', async function () {
    const stderr = spy()

    globalThis.unifiedEngineTestCalls = 0
    globalThis.unifiedEngineTestValues = {}

    const code = await run({
      cwd: new URL('config-plugins-basic-reconfigure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        './preset/index.js',
        ['./preset/plugin.js', {two: false, three: true}]
      ],
      processor: noop(),
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(globalThis.unifiedEngineTestCalls, 1)
    assert.deepEqual(
      globalThis.unifiedEngineTestValues,
      {one: true, three: true, two: false},
      'should pass the correct options to plugins'
    )
  })

  await t.test('should use `plugins` as list of objects', async function () {
    const stderr = spy()

    globalThis.unifiedEngineTestCalls = 0
    globalThis.unifiedEngineTestValues = {}

    const code = await run({
      cwd: new URL('config-plugins-basic-reconfigure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: {
        './preset/index.js': null,
        './preset/plugin.js': {three: true, two: false}
      },
      processor: noop(),
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(globalThis.unifiedEngineTestCalls, 1)
    assert.deepEqual(
      globalThis.unifiedEngineTestValues,
      {one: true, three: true, two: false},
      'should pass the correct options to plugins'
    )
  })
})
