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
test('reporting', function (t) {
  t.plan(4);

  t.test('should fail for warnings with `frail`', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop().use(function () {
        return function (tree, file) {
          file.message('Warning');
        };
      }),
      cwd: join(fixtures, 'one-file'),
      streamError: stderr.stream,
      globs: ['one.txt'],
      frail: true
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(),
        [
          'one.txt',
          '  1:1  warning  Warning',
          '',
          '⚠ 1 warning',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test(
    'should not report succesful files when `quiet` (#1)',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop().use(function () {
          return function (tree, file) {
            if (file.stem === 'two') {
              file.message('Warning!');
            }
          };
        }),
        cwd: join(fixtures, 'two-files'),
        streamError: stderr.stream,
        globs: ['.'],
        extensions: ['txt'],
        quiet: true
      }, function (err, code) {
        st.error(err, 'should not fail fatally');
        st.equal(code, 0, 'should exit with `0`');

        st.equal(
          stderr(),
          [
            'two.txt',
            '  1:1  warning  Warning!',
            '',
            '⚠ 1 warning',
            ''
          ].join('\n'),
          'should report correctly'
        );
      });
    }
  );

  t.test(
    'should not report succesful files when `quiet` (#2)',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop(),
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        globs: ['.'],
        extensions: ['txt'],
        quiet: true
      }, function (err, code) {
        st.error(err, 'should not fail fatally');
        st.equal(code, 0, 'should exit with `0`');
        st.equal(stderr(), '', 'should not report');
      });
    }
  );

  t.test(
    'should not report succesful files when `silent`',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop().use(function () {
          return function (tree, file) {
            file.message('Warning!');

            if (file.stem === 'two') {
              file.fail('Error!');
            }
          };
        }),
        cwd: join(fixtures, 'two-files'),
        streamError: stderr.stream,
        globs: ['.'],
        extensions: ['txt'],
        silent: true
      }, function (err, code) {
        st.error(err, 'should not fail fatally');
        st.equal(code, 1, 'should exit with `1`');

        st.equal(
          stderr(),
          [
            'two.txt',
            '  1:1  error  Error!',
            '',
            '✖ 1 error',
            ''
          ].join('\n'),
          'should report correctly'
        );
      });
    }
  );
});
