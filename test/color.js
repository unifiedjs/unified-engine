/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* Dependencies. */
var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

/* Methods. */
var join = path.join;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Tests. */
test('color', function (t) {
  t.plan(1);

  t.test('should support color', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'empty'),
      streamError: stderr.stream,
      globs: ['readme.md'],
      color: true
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          '\x1b[4m\x1b[31mreadme.md\x1b[39m\x1b[24m',
          '  1:1  \x1b[31merror\x1b[39m  No such file or directory',
          '',
          '\x1b[31m✖\x1b[39m 1 error',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });
});
