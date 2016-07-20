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
test('ignore', function (t) {
  t.plan(6);

  engine({
    processor: noop,
    cwd: join(fixtures, 'empty'),
    globs: ['.'],
    detectIgnore: false,
    ignorePath: '.missing-ignore',
    extensions: ['txt']
  }, function (err) {
    t.equal(
      err.message.slice(0, err.message.indexOf(':')),
      'Cannot read ignore file',
      'should fail fatally when custom ignore files ' +
      'are not found'
    );
  });

  t.test('should support custom ignore files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'ignore-file'),
      streamError: stderr.stream,
      globs: ['.'],
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
      globs: ['.'],
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
      globs: ['.'],
      // no `ignoreName`
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

  t.test('should look into negated hidden files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'hidden-directory'),
      streamError: stderr.stream,
      globs: ['.'],
      detectIgnore: true,
      ignoreName: '.fooignore',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          '.hidden/two.txt: no issues found',
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
      globs: ['.'],
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
