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
var PassThrough = require('stream').PassThrough;
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

/* Methods. */
var join = path.join;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Tests. */
test('stdin', function (t) {
  t.plan(2);

  t.test('should support stdin', function (st) {
    var stdout = spy();
    var stderr = spy();
    var stream = new PassThrough();
    var index = 0;

    st.plan(4);

    function send() {
      if (++index > 10) {
        stream.end();
      } else {
        stream.write(index + '\n');
        setTimeout(send, 10);
      }
    }

    send();

    engine({
      processor: noop,
      cwd: join(fixtures, 'empty'),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream
    }, function (err, code) {
      st.equal(
        stdout(),
        '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
        'should output by default'
      );

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        '<stdin>: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should not output if `out: false`', function (st) {
    var stdout = spy();
    var stderr = spy();
    var stream = new PassThrough();
    var index = 0;

    st.plan(4);

    function send() {
      if (++index > 10) {
        stream.end();
      } else {
        stream.write(index + '\n');
        setTimeout(send, 10);
      }
    }

    send();

    engine({
      processor: noop,
      cwd: join(fixtures, 'empty'),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      out: false
    }, function (err, code) {
      st.equal(stdout(), '', 'should not output without `out`');
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        '<stdin>: no issues found\n',
        'should report'
      );
    });
  });
});
