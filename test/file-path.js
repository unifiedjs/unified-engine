'use strict';

var path = require('path');
var PassThrough = require('stream').PassThrough;
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('file-path', function (t) {
  t.plan(2);

  t.test('should throw on `file-path` with files', function (st) {
    st.plan(1);

    engine({
      processor: noop,
      cwd: join(fixtures, 'simple-structure'),
      globs: ['.'],
      filePath: 'qux/quux.foo',
      extensions: ['txt']
    }, function (err) {
      st.equal(
        err.message.split('\n').slice(0, 2).join('\n'),
        [
          'Do not pass both `--file-path` and real files.',
          'Did you mean to pass stdin instead of files?'
        ].join('\n'),
        'should fail'
      );
    });
  });

  t.test('should support `file-path`', function (st) {
    var stdout = spy();
    var stderr = spy();
    var stream = new PassThrough();
    var index = 0;

    st.plan(3);

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
      streamOut: stdout.stream,
      streamError: stderr.stream,
      streamIn: stream,
      filePath: 'foo/bar.baz'
    }, function (err, code) {
      stdout();

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'foo/bar.baz: no issues found\n',
        'should report'
      );
    });
  });
});
