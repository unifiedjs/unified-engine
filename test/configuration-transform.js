/**
 * @typedef {import('../index.js').Preset['plugins']} Plugins
 * @typedef {import('../index.js').Preset['settings']} Settings
 * @typedef {import('../lib/configuration.js').Configuration} Configuration
 */

/**
 * @typedef RawValue
 *   Format of our example custom config.
 * @property {Settings} options
 *   Settings.
 * @property {Plugins} plugs
 *   Plugins.
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('`configTransform`', async function (t) {
  await t.test('should support a `configTransform`', async function () {
    await new Promise(function (resolve) {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0
      globalThis.unifiedEngineTestValues = {}

      engine(
        {
          /**
           * @param {RawValue} raw
           *   Format of our example custom config.
           * @returns
           *   Expected format.
           */
          configTransform(raw) {
            return {settings: raw.options, plugins: raw.plugs}
          },
          cwd: new URL('config-transform/', fixtures),
          extensions: ['txt'],
          files: ['.'],
          packageField: 'foo',
          processor: noop(),
          streamError: stderr.stream
        },
        function (error, code, result) {
          assert.equal(error, undefined)
          assert.equal(code, 0)
          assert.equal(stderr(), 'one.txt: no issues found\n')

          /** @type {Configuration} */
          // @ts-expect-error: access the internals
          const config = result.configuration
          const cache = config.findUp.cache
          const keys = Object.keys(cache)

          assert.equal(keys.length, 1)
          const value = cache[keys[0]]
          assert(typeof value === 'object')
          assert('settings' in value)
          assert.deepEqual(value.settings, {foxtrot: true})
          assert.deepEqual(value.plugins[0][1], {golf: false})

          assert.equal(globalThis.unifiedEngineTestCalls, 1)
          assert.deepEqual(globalThis.unifiedEngineTestValues, {golf: false})

          resolve(undefined)
        }
      )
    })
  })
})
