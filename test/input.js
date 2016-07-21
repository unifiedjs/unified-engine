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
var unified = require('unified');
var toVFile = require('to-vfile');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

/* Methods. */
var join = path.join;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Tests. */
test('input', function (t) {
  t.plan(14);

  t.test('should fail without input', function (st) {
    var stream = new PassThrough();

    st.plan(1);

    /* Spoof stdin(4). */
    stream.isTTY = true;

    engine({processor: unified, streamIn: stream}, function (err) {
      st.equal(err.message, 'No input', 'should fail');
    });

    stream.end();
  });

  t.test('should not fail on empty input stream', function (st) {
    var stderr = spy();
    var stream = new PassThrough();

    st.plan(3);

    engine({
      processor: noop,
      streamIn: stream,
      streamError: stderr.stream
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(stderr(), '<stdin>: no issues found\n', 'should report');
    });

    stream.end('');
  });

  t.test('should report unfound given files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: unified,
      cwd: join(fixtures, 'empty'),
      streamError: stderr.stream,
      globs: ['readme.md']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          'readme.md',
          '        1:1  error    No such file or directory',
          '',
          '✖ 1 error',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should report unfound given directories', function (st) {
    st.plan(1);

    engine({
      processor: unified,
      cwd: join(fixtures, 'directory'),
      globs: ['empty/']
    }, function (err) {
      st.equal(
        err.message,
        'No input',
        'should fail fatally when with an empty directory'
      );
    });
  });

  t.test('should search for extensions', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'extensions'),
      streamError: stderr.stream,
      globs: ['.'],
      extensions: ['txt', '.text']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(true),
        [
          'bar.text: no issues found',
          'foo.txt: no issues found',
          'nested/quux.text: no issues found',
          'nested/qux.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should search a directory for extensions', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'extensions'),
      streamError: stderr.stream,
      globs: ['nested'],
      extensions: ['txt', 'text']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'nested/quux.text: no issues found\n' +
        'nested/qux.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should search for globs matching files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'globs'),
      streamError: stderr.stream,
      globs: ['*/*.+(txt|text)'],
      extensions: []
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'nested/no-3.txt: no issues found\n' +
        'nested/no-4.text: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should search for globs matching dirs', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'globs'),
      streamError: stderr.stream,
      globs: ['**/nested'],
      extensions: []
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'nested/no-3.txt: no issues found\n' +
        'nested/no-4.text: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should ignore ignored files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'globs-ignore'),
      streamError: stderr.stream,
      globs: ['**/*.txt'],
      extensions: []
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'nested/two.txt: no issues found\n' +
        'one.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should include given ignored files (#1)', function (st) {
    var cwd = join(fixtures, 'ignore-file');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      ignoreName: '.fooignore',
      files: [
        toVFile(join(cwd, 'one.txt')),
        toVFile(join(cwd, 'nested', 'two.txt')),
        toVFile(join(cwd, 'nested', 'three.txt'))
      ]
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          'one.txt: no issues found',
          '',
          'nested/two.txt',
          '        1:1  error    Cannot process ' +
              'given file: it’s ignored',
          '',
          'nested/three.txt: no issues found',
          '',
          '✖ 1 error',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should include given ignored files (#2)', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'globs-ignore'),
      streamError: stderr.stream,
      globs: ['node_modules/ignore-one.txt', '.'],
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          'nested/two.txt: no issues found',
          '',
          'node_modules/ignore-one.txt',
          '        1:1  error    Cannot process ' +
              'specified file: it’s ignored',
          '',
          'one.txt: no issues found',
          '',
          '✖ 1 error',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('silentlyIgnore: skip detected ignored files', function (st) {
    var cwd = join(fixtures, 'ignore-file');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      ignoreName: '.fooignore',
      silentlyIgnore: true,
      files: [
        toVFile(join(cwd, 'one.txt')),
        toVFile(join(cwd, 'nested', 'two.txt')),
        toVFile(join(cwd, 'nested', 'three.txt'))
      ]
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'one.txt: no issues found',
          'nested/three.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('silentlyIgnore: skip detected ignored files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'globs-ignore'),
      silentlyIgnore: true,
      streamError: stderr.stream,
      globs: ['node_modules/ignore-one.txt', '.'],
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should search if given files', function (st) {
    var cwd = join(fixtures, 'simple-structure');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      globs: ['nested'],
      extensions: ['txt'],
      files: [toVFile(join(cwd, 'one.txt'))]
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: no issues found\n' +
        'nested/three.txt: no issues found\n' +
        'nested/two.txt: no issues found\n',
        'should report'
      );
    });
  });
});
