'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('color', function (t) {
  t.plan(1);

  t.test('should support color', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'empty'),
      streamError: stderr.stream,
      files: ['readme.md'],
      color: true
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          '\u001B[4m\u001B[31mreadme.md\u001B[39m\u001B[24m',
          '  1:1  \u001B[31merror\u001B[39m  No such file or directory',
          '',
          '\u001B[31m✖\u001B[39m 1 error',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });
});
