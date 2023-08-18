import assert from 'node:assert/strict'
import test from 'node:test'
import {promisify} from 'node:util'
import {unified} from 'unified'
import {engine} from 'unified-engine'

const run = promisify(engine)

test('engine', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('unified-engine')).sort(), [
      'Configuration',
      'engine'
    ])
  })

  await t.test('should throw w/o `callback`', async function () {
    assert.throws(function () {
      // @ts-expect-error: check how the runtime handles no callback.
      engine()
    }, /Missing `callback`/)
  })

  await t.test('should fail when w/o options', async function () {
    try {
      // @ts-expect-error: check how the runtime handles `null`.
      await run(null)
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Missing `processor`/)
    }
  })

  await t.test('should fail when w/o processor', async function () {
    try {
      // @ts-expect-error: check how the runtime handles `processor` missing.
      await run({})
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Missing `processor`/)
    }
  })

  await t.test('should fail w/ `output` and w/ `out`', async function () {
    try {
      await run({out: true, output: true, processor: unified()})
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Cannot accept both `output` and `out`/)
    }
  })

  await t.test('should fail w/ `detectConfig` w/o `rcName`', async function () {
    try {
      await run({detectConfig: true, processor: unified()})
      assert.fail()
    } catch (error) {
      assert.match(
        String(error),
        /Missing `rcName` or `packageField` with `detectConfig`/
      )
    }
  })

  await t.test(
    'should fail w/ `detectIgnore` w/o `ignoreName`',
    async function () {
      try {
        await run({detectIgnore: true, processor: unified()})
        assert.fail()
      } catch (error) {
        assert.match(String(error), /Missing `ignoreName` with `detectIgnore`/)
      }
    }
  )
})
