import test from 'tape'
import unified from 'unified'
import {engine} from '../index.js'

test('engine', (t) => {
  t.plan(4)

  t.test('engine', (t) => {
    t.plan(3)

    t.throws(
      () => {
        // @ts-expect-error: runtime.
        engine()
      },
      /Missing `callback`/,
      'should throw w/o `callback`'
    )

    // @ts-expect-error: runtime.
    engine(null, (error) => {
      t.equal(
        error && error.message,
        'Missing `processor`',
        'should fail when w/o options'
      )
    })

    // @ts-expect-error: runtime.
    engine({}, (error) => {
      t.equal(
        error && error.message,
        'Missing `processor`',
        'should fail when w/o processor'
      )
    })
  })

  t.test('should fail w/ `output` and w/ `out`', (t) => {
    t.plan(1)

    engine({processor: unified(), output: true, out: true}, (error) => {
      t.equal(
        error && error.message,
        'Cannot accept both `output` and `out`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectConfig` w/o `rcName`', (t) => {
    t.plan(1)

    engine({processor: unified(), detectConfig: true}, (error) => {
      t.equal(
        error && error.message,
        'Missing `rcName` or `packageField` with `detectConfig`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectIgnore` w/o `ignoreName`', (t) => {
    t.plan(1)

    engine({processor: unified(), detectIgnore: true}, (error) => {
      t.equal(
        error && error.message,
        'Missing `ignoreName` with `detectIgnore`',
        'should fail'
      )
    })
  })
})
