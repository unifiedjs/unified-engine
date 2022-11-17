import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('`defaultConfig`', async () => {
  const defaultConfig = {
    settings: {alpha: true},
    plugins: {'./test-defaults.js': {bravo: false}}
  }

  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugins.
    globalThis.unifiedEngineTestCalls = 0
    // @ts-expect-error: set by plugins.
    globalThis.unifiedEngineTestValues = {}

    engine(
      {
        processor: noop(),
        streamError: stderr.stream,
        cwd: new URL('config-default/', fixtures),
        files: ['.'],
        packageField: 'bar',
        extensions: ['txt'],
        defaultConfig
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )

        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {defaultsSettings: {alpha: true}, defaultsOptions: {bravo: false}},
          'should pass the correct option to plugins'
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
        streamError: stderr.stream,
        cwd: new URL('config-default/', fixtures),
        files: ['.'],
        packageField: 'foo',
        extensions: ['txt'],
        defaultConfig
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use found otherwise'
        )

        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {foundSettings: {charlie: true}, foundOptions: {delta: false}},
          'should pass the correct option to plugins'
        )

        resolve(undefined)
      }
    )
  })
})
