import assert from 'node:assert/strict'
import test from 'node:test'
import {unified} from 'unified'
import {engine} from '../index.js'

test('engine', async () => {
  assert.throws(
    () => {
      // @ts-expect-error: runtime.
      engine()
    },
    /Missing `callback`/,
    'should throw w/o `callback`'
  )

  await new Promise((resolve) => {
    // @ts-expect-error: runtime.
    engine(null, (error) => {
      assert.equal(
        error && error.message,
        'Missing `processor`',
        'should fail when w/o options'
      )
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    // @ts-expect-error: runtime.
    engine({}, (error) => {
      assert.equal(
        error && error.message,
        'Missing `processor`',
        'should fail when w/o processor'
      )
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    engine({processor: unified(), output: true, out: true}, (error) => {
      assert.equal(
        error && error.message,
        'Cannot accept both `output` and `out`',
        'should fail w/ `output` and w/ `out`'
      )
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    engine({processor: unified(), detectConfig: true}, (error) => {
      assert.equal(
        error && error.message,
        'Missing `rcName` or `packageField` with `detectConfig`',
        'should fail w/ `detectConfig` w/o `rcName`'
      )
      resolve(undefined)
    })
  })

  await new Promise((resolve) => {
    engine({processor: unified(), detectIgnore: true}, (error) => {
      assert.equal(
        error && error.message,
        'Missing `ignoreName` with `detectIgnore`',
        'should fail w/ `detectIgnore` w/o `ignoreName`'
      )
      resolve(undefined)
    })
  })
})
