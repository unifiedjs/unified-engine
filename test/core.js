/**
 * @import {Callback} from 'unified-engine'
 */

import assert from 'node:assert/strict'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {unified} from 'unified'
import {engine} from 'unified-engine'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

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

  await t.test('should support a `callback`', async function () {
    const streamIn = new PassThrough()
    const stdout = spy()
    /** @type {unknown} */
    let returned

    streamIn.end('x')

    /** @type {Parameters<Callback>} */
    const parameters = await new Promise(function (resolve) {
      returned = engine(
        {
          processor: noop,
          streamError: spy().stream,
          streamIn,
          streamOut: stdout.stream
        },
        function (...parameters) {
          resolve(parameters)
        }
      )
    })

    assert.equal(returned, undefined)
    assert.equal(parameters[0], undefined)
    assert.equal(parameters[1], 0)
    assert.equal(parameters[2]?.files.length, 1)
    assert.equal(stdout(), 'x')
  })

  await t.test('should return a promise w/o `callback`', async function () {
    const streamIn = new PassThrough()

    streamIn.end('x')

    const stdout = spy()

    const result = await engine({
      processor: noop,
      streamError: spy().stream,
      streamIn,
      streamOut: stdout.stream
    })

    assert.equal(result.code, 0)
    assert.equal(result.files.length, 1)
    assert.deepEqual(result.fileSet.valueOf(), result.files)
    assert.equal(stdout(), 'x')
  })
})
