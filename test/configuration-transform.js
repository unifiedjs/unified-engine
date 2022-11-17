/**
 * @typedef {import('../index.js').Preset['settings']} Settings
 * @typedef {import('../index.js').Preset['plugins']} Plugins
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('`configTransform`', async () => {
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
        cwd: new URL('config-transform/', fixtures),
        files: ['.'],
        packageField: 'foo',
        configTransform(
          /** @type {{options: Settings, plugs: Plugins}} */ raw
        ) {
          return {settings: raw.options, plugins: raw.plugs}
        },
        extensions: ['txt']
      },
      (error, code, result) => {
        // @ts-expect-error: internals
        const cache = result.configuration.findUp.cache
        const keys = Object.keys(cache)

        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        assert.deepEqual(
          // @ts-expect-error: added by plugins.
          globalThis.unifiedEngineTestValues,
          {golf: false},
          'should pass the correct options to the plugins'
        )

        assert.equal(keys.length, 1, 'should have one cache entry')

        assert.deepEqual(
          cache[keys[0]].settings,
          {foxtrot: true},
          'should set the correct settings'
        )

        assert.deepEqual(
          cache[keys[0]].plugins[0][1],
          {golf: false},
          'should pass the correct options to plugins'
        )

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )

        resolve(undefined)
      }
    )
  })
})
