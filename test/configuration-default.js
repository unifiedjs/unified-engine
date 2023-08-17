import assert from 'node:assert/strict'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)
const run = promisify(engine)

test('`defaultConfig`', async function (t) {
  const defaultConfig = {
    plugins: {'./test-defaults.js': {bravo: false}},
    settings: {alpha: true}
  }

  await t.test(
    'should use default config when no config is found',
    async function () {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0
      globalThis.unifiedEngineTestValues = {}

      const code = await run({
        cwd: new URL('config-default/', fixtures),
        defaultConfig,
        extensions: ['txt'],
        files: ['.'],
        packageField: 'bar',
        processor: noop(),
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(globalThis.unifiedEngineTestCalls, 1)
      assert.deepEqual(globalThis.unifiedEngineTestValues, {
        defaultsOptions: {bravo: false},
        defaultsSettings: {alpha: true}
      })
    }
  )

  await t.test(
    'should use found config when a config is found',
    async function () {
      const stderr = spy()

      globalThis.unifiedEngineTestCalls = 0
      globalThis.unifiedEngineTestValues = {}

      const code = await run({
        cwd: new URL('config-default/', fixtures),
        defaultConfig,
        extensions: ['txt'],
        files: ['.'],
        packageField: 'foo',
        processor: noop(),
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(globalThis.unifiedEngineTestCalls, 1)
      assert.deepEqual(
        globalThis.unifiedEngineTestValues,
        {foundOptions: {delta: false}, foundSettings: {charlie: true}},
        'should pass the correct option to plugins'
      )
    }
  )
})
