/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unist').Literal} Literal
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('settings', async () => {
  await new Promise((resolve) => {
    const stderr = spy()
    let called = false

    engine(
      {
        processor: noop().use(function () {
          assert.deepEqual(
            this.data('settings'),
            {alpha: true},
            'should configure'
          )
          called = true
        }),
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        settings: {alpha: true}
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use `settings`'
        )
        assert.ok(called)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let called = false

    engine(
      {
        processor: noop().use(function () {
          assert.deepEqual(
            this.data('settings'),
            {alpha: false, bravo: 'charlie', delta: 1},
            'should configure'
          )
          called = true
        }),
        cwd: new URL('config-settings-cascade/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        rcName: '.foorc',
        settings: {alpha: false, bravo: 'charlie'}
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should cascade `settings`'
        )
        assert.ok(called)
        resolve(undefined)
      }
    )
  })
})

test('plugins', async () => {
  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [
          () => () => {
            calls++
          },
          [
            /** @param {unknown} options */
            (options) => () => {
              assert.deepEqual(options, {alpha: true}, 'transformer')
              calls++
            },
            {alpha: true}
          ]
        ]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use `plugins` as list of functions'
        )
        assert.equal(calls, 2)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugins.
    globalThis.unifiedEngineTestCalls = 0
    // @ts-expect-error: set by plugins.
    globalThis.unifiedEngineTestValues = {}

    engine(
      {
        processor: noop(),
        cwd: new URL('config-plugins-basic-reconfigure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [
          './preset/index.js',
          ['./preset/plugin.js', {two: false, three: true}]
        ]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use `plugins` as list of strings'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {one: true, two: false, three: true},
          'should pass the correct options to plugins'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugins.
    globalThis.unifiedEngineTestCalls = 0
    // @ts-expect-error: set by plugins.
    globalThis.unifiedEngineTestValues = {}

    engine(
      {
        processor: noop(),
        cwd: new URL('config-plugins-basic-reconfigure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: {
          './preset/index.js': null,
          './preset/plugin.js': {two: false, three: true}
        }
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use `plugins` as list of objects'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {one: true, two: false, three: true},
          'should pass the correct options to plugins'
        )
        resolve(undefined)
      }
    )
  })
})
