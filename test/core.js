'use strict'

var test = require('tape')
var unified = require('unified')
var engine = require('..')

test('engine', function(t) {
  t.plan(4)

  t.test('engine', function(st) {
    st.plan(3)

    st.throws(
      function() {
        engine()
      },
      /Missing `callback`/,
      'should throw w/o `callback`'
    )

    engine(null, function(err) {
      st.equal(
        err.message,
        'Missing `processor`',
        'should fail when w/o options'
      )
    })

    engine({}, function(err) {
      st.equal(
        err.message,
        'Missing `processor`',
        'should fail when w/o processor'
      )
    })
  })

  t.test('should fail w/ `output` and w/ `out`', function(st) {
    st.plan(1)

    engine({processor: unified, output: true, out: true}, function(err) {
      st.equal(
        err.message,
        'Cannot accept both `output` and `out`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectConfig` w/o `rcName`', function(st) {
    st.plan(1)

    engine({processor: unified, detectConfig: true}, function(err) {
      st.equal(
        err.message,
        'Missing `rcName` or `packageField` with `detectConfig`',
        'should fail'
      )
    })
  })

  t.test('should fail w/ `detectIgnore` w/o `ignoreName`', function(st) {
    st.plan(1)

    engine({processor: unified, detectIgnore: true}, function(err) {
      st.equal(
        err.message,
        'Missing `ignoreName` with `detectIgnore`',
        'should fail'
      )
    })
  })
})
