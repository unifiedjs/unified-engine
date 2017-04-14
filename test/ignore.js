'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('ignore', function (t) {
  t.plan(5);

  t.test(
    'should fail fatally when custom ignore files ' +
    'are not found',
    function (st) {
      var cwd = join(fixtures, 'simple-structure');
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        files: ['one.txt'],
        detectIgnore: false,
        ignorePath: '.missing-ignore',
        extensions: ['txt']
      }, function (err, code) {
        st.error(err, 'should not fail fatally');
        st.equal(code, 1, 'should exit with `1`');

        st.equal(
          stderr().split('\n').slice(0, 2).join('\n'),
          [
            'one.txt',
            '  1:1  error  Error: Cannot read given file `.missing-ignore`'
          ].join('\n'),
          'should report'
        );
      });
    }
  );

  t.test('should support custom ignore files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'ignore-file'),
      streamError: stderr.stream,
      files: ['.'],
      detectIgnore: false,
      ignorePath: '.fooignore',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support searching ignore files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'ignore-file'),
      streamError: stderr.stream,
      files: ['.'],
      detectIgnore: true,
      ignoreName: '.fooignore',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should not look into hidden files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'hidden-directory'),
      streamError: stderr.stream,
      files: ['.'],
      // No `ignoreName`.
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'one.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support no ignore files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'simple-structure'),
      streamError: stderr.stream,
      files: ['.'],
      detectIgnore: true,
      ignoreName: '.fooignore',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/three.txt: no issues found',
          'nested/two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });
});
