import assert from 'node:assert/strict'
import test from 'node:test'
import {unified} from 'unified'
import {engine} from 'unified-engine'

test('engine', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('unified-engine')).sort(), [
      'Configuration',
      'engine'
    ])
  })

  await t.test('should fail when w/o options', async function () {
    await assert.rejects(async function () {
      // @ts-expect-error: check how the runtime handles `null`.
      await engine(null)
    }, /Missing `processor`/)
  })

  await t.test('should fail when w/o processor', async function () {
    await assert.rejects(async function () {
      // @ts-expect-error: check how the runtime handles `processor` missing.
      await engine({})
    }, /Missing `processor`/)
  })

  await t.test('should fail w/ `output` and w/ `out`', async function () {
    await assert.rejects(async function () {
      await engine({out: true, output: true, processor: unified()})
    }, /Cannot accept both `output` and `out`/)
  })

  await t.test('should fail w/ `detectConfig` w/o `rcName`', async function () {
    await assert.rejects(async function () {
      await engine({detectConfig: true, processor: unified()})
    }, /Missing `rcName` or `packageField` with `detectConfig`/)
  })

  await t.test(
    'should fail w/ `detectIgnore` w/o `ignoreName`',
    async function () {
      await assert.rejects(async function () {
        await engine({detectIgnore: true, processor: unified()})
      }, /Missing `ignoreName` with `detectIgnore`/)
    }
  )

  await t.test('should work w/o `callback`', async function () {
    try {
      await engine({processor: unified()})
      assert.fail()
    } catch {}
  })
})
