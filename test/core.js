/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* Dependencies. */
var test = require('tape');
var unified = require('unified');
var engine = require('..');

/* Tests. */
test('engine', function (t) {
  t.plan(6);

  t.throws(
    function () {
      engine();
    },
    /Missing `callback`/,
    'should throw without `callback`'
  );

  engine(null, function (err) {
    t.equal(
      err.message,
      'Missing `processor`',
      'should fail when without options'
    );
  });

  engine({}, function (err) {
    t.equal(
      err.message,
      'Missing `processor`',
      'should fail when without processor'
    );
  });

  t.test('should fail when with `output` and `out`', function (st) {
    st.plan(1);

    engine({
      processor: unified,
      output: true,
      out: true
    }, function (err) {
      st.equal(
        err.message,
        'Cannot accept both `output` and `out`',
        'should fail'
      );
    });
  });

  t.test(
    'should fail when with `detectConfig` and without `rcName`',
    function (st) {
      st.plan(1);

      engine({
        processor: unified,
        detectConfig: true
      }, function (err) {
        st.equal(
          err.message,
          'Missing `rcName` or `packageField` with `detectConfig`',
          'should fail'
        );
      });
    }
  );

  t.test(
    'should fail when with `detectIgnore` and without `ignoreName`',
    function (st) {
      st.plan(1);

      engine({
        processor: unified,
        detectIgnore: true
      }, function (err) {
        st.equal(
          err.message,
          'Missing `ignoreName` with `detectIgnore`',
          'should fail'
        );
      });
    }
  );
});
