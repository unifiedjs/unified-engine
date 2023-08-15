import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('configuration-presets', async () => {
  await new Promise((resolve) => {
    const root = new URL('config-presets-invalid/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = cleanError(stderr(), 3)

        const expected = [
          'one.txt',
          ' error Error: Cannot parse file `.foorc`',
          'Expected a list or object of plugins, not `./preset`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail on invalid `presets`'
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
        cwd: new URL('config-presets-local/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
        // @ts-expect-error: incremented by plugins.
        assert.equal(globalThis.unifiedEngineTestCalls, 2)

        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {local: {three: true, two: false}, deep: {one: true, two: true}},
          'should pass the correct options to the local and deep plugins'
        )

        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('config-presets-missing-plugin/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = cleanError(stderr(), 2)

        const expected = [
          'one.txt',
          ' error Error: Could not find module `./plugin.js`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle missing plugins in presets'
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
        cwd: new URL('config-plugins-reconfigure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should reconfigure plugins'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 5)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {
            arrayToObject: {delta: 1},
            mergeObject: {one: true, two: false, three: true},
            objectToArray: [2],
            stringToArray: [1],
            stringToObject: {bravo: 1}
          },
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
        cwd: new URL('config-preset-plugins-reconfigure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should reconfigure imported plugins'
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

    engine(
      {
        processor: noop,
        cwd: new URL('config-plugins-reconfigure-off/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should reconfigure: turn plugins off'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop().use(function () {
          assert.deepEqual(
            this.data('settings'),
            {alpha: true},
            'should configure'
          )
          calls++
        }),
        cwd: new URL('config-settings-reconfigure-a/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should reconfigure settings'
        )
        assert.equal(calls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop().use(function () {
          assert.deepEqual(
            this.data('settings'),
            {alpha: true},
            'should configure'
          )
          calls++
        }),
        cwd: new URL('config-settings-reconfigure-b/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should reconfigure settings (2)'
        )
        assert.equal(calls, 1)
        resolve(undefined)
      }
    )
  })
})
