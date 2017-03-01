'use strict';

var path = require('path');
var PassThrough = require('stream').PassThrough;
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('stdin', function (t) {
  t.plan(3);

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

  t.test('should support config files on stdin', function (st) {
    var stdout = spy();
    var stderr = spy();
    var stream = new PassThrough();
    var index = 0;

    st.plan(2);

    function send() {
      if (++index > 10) {
        stream.end();
      } else {
        stream.write(index + '\n');
        setTimeout(send, 10);
      }
    }

    send();

    function plugin() {
      st.deepEqual(this.data('settings'), {alpha: true}, 'should configure');
    }

    engine({
      processor: noop().use(plugin),
      cwd: join(fixtures, 'config-settings'),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      packageField: 'fooConfig',
      rcName: '.foorc'
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr(), stdout()],
        [null, 0, '<stdin>: no issues found\n', '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n'],
        'should work'
      );
    });
  });
});
