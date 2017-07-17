'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

/* https://github.com/sindresorhus/eslint-formatter-pretty/blob/159b30a/index.js#L90-L93 */
var original = process.env.CI;

process.env.CI = 'true';

test.onFinish(function () {
  process.env.CI = original;
});

test('reporting', function (t) {
  t.plan(7);

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
      files: ['one.txt'],
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
        files: ['.'],
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
        files: ['.'],
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
        files: ['.'],
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

  t.test('should support custom reporters (without prefix)', function (st) {
    var stderr = spy();
    var root = join(fixtures, 'two-files');

    st.plan(1);

    engine({
      processor: noop().use(function () {
        return function (tree, file) {
          if (file.stem === 'two') {
            file.fail('Error!');
          }
        };
      }),
      cwd: root,
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      reporter: 'json',
      reporterOptions: {
        pretty: true
      }
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          1,
          JSON.stringify([
            {
              path: 'one.txt',
              cwd: root,
              history: ['one.txt'],
              messages: []
            },
            {
              path: 'two.txt',
              cwd: root,
              history: ['two.txt'],
              messages: [{
                reason: 'Error!',
                line: null,
                column: null,
                location: {
                  start: {line: null, column: null},
                  end: {line: null, column: null}
                },
                ruleId: null,
                source: null,
                fatal: true,
                stack: null
              }]
            }
          ], null, 2) + '\n'
        ]
      );
    });
  });

  t.test('should support custom reporters (with prefix)', function (st) {
    var stderr = spy();
    var root = join(fixtures, 'two-files');

    st.plan(1);

    engine({
      processor: noop().use(function () {
        return function (tree, file) {
          if (file.stem === 'one') {
            file.info('Info!');
          }
        };
      }),
      cwd: root,
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      reporter: 'vfile-reporter-pretty'
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          [
            '',
            '  \x1b[4mone.txt\x1b[24m',
            '  \x1b[33m⚠\x1b[39m  Info!  ',
            '',
            '  \x1b[33m1 warning\x1b[39m',
            ''].join('\n')
        ]
      );
    });
  });

  t.test('should fail on an unfound reporter', function (st) {
    var root = join(fixtures, 'one-file');

    st.plan(1);

    engine({
      processor: noop(),
      cwd: root,
      files: ['.'],
      extensions: ['txt'],
      reporter: 'missing'
    }, function (err) {
      st.equal(err.message, 'Could not find reporter `missing`');
    });
  });
});
