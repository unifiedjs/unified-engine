'use strict';

var fs = require('fs');
var path = require('path');
var PassThrough = require('stream').PassThrough;
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;
var read = fs.readFileSync;
var unlink = fs.unlinkSync;

var fixtures = join(__dirname, 'fixtures');

test('inspect', function (t) {
  t.plan(3);

  t.test('should write text when `inspect` is given', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop(),
      cwd: cwd,
      streamError: stderr.stream,
      output: 'formatted.txt',
      inspect: true,
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var doc = read(join(cwd, 'formatted.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'formatted.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt > formatted.txt: written\n',
        'should report'
      );

      st.equal(
        doc,
        'text: ""\n',
        'should write the transformed doc as a formatted syntax tree'
      );
    });
  });

  t.test('should support `inspect` for stdin', function (st) {
    var stdin = new PassThrough();
    var stdout = spy();
    var stderr = spy();

    setTimeout(send, 50);

    function send() {
      stdin.end('\n');
    }

    st.plan(1);

    engine({
      processor: noop,
      streamIn: stdin,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      inspect: true
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr(), stdout()],
        [
          null,
          0,
          '<stdin>: no issues found\n',
          'text: "\\n"\n'
        ],
        'should work'
      );
    });
  });

  t.test('should support `inspect` with colour', function (st) {
    var stdin = new PassThrough();
    var stdout = spy();
    var stderr = spy();

    setTimeout(send, 50);

    function send() {
      stdin.end('\n');
    }

    st.plan(1);

    engine({
      processor: noop,
      streamIn: stdin,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      inspect: true,
      color: true
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr(), stdout()],
        [
          null,
          0,
          '\x1b[4m\x1b[32m<stdin>\x1b[39m\x1b[24m: no issues found\n',
          'text\x1b[2m: \x1b[22m\x1b[32m"\\n"\x1b[39m\n'
        ],
        'should work'
      );
    });
  });
});
