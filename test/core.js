import test from 'tape'
import unified from 'unified'
import {engine} from '../index.js'

test('engine', function (t) {
  t.plan(4)

  t.test('engine', function (t) {
    t.plan(3)

    t.throws(
      function () {
        engine()
      },
      /Missing `callback`/,
      'should throw w/o `callback`'
    )

    engine(null, function (error) {
      t.equal(
        error.message,
        'Missing `processor`',
        'should fail when w/o options'
      )
    })

    engine({}, function (error) {
      t.equal(
        error.message,
        'Missing `processor`',
        'should fail when w/o processor'
      )
    })
  })

  t.test('should fail w/ `output` and w/ `out`', function (t) {
    t.plan(1)

    engine({processor: unified, output: true, out: true}, function (error) {
      t.equal(
        error.message,
        'Cannot accept both `output` and `out`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectConfig` w/o `rcName`', function (t) {
    t.plan(1)

    engine({processor: unified, detectConfig: true}, function (error) {
      t.equal(
        error.message,
        'Missing `rcName` or `packageField` with `detectConfig`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectIgnore` w/o `ignoreName`', function (t) {
    t.plan(1)

    engine({processor: unified, detectIgnore: true}, function (error) {
      t.equal(
        error.message,
        'Missing `ignoreName` with `detectIgnore`',
        'should fail'
      )
    })
  })
})
