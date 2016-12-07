'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('configuration', function (t) {
  t.plan(6);

  t.test('should cascade `plugins`', function (st) {
    var stderr = spy();

    // More assertions are in loaded plugins.
    st.plan(7);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-plugins-cascade'),
      streamError: stderr.stream,
      globs: ['.'],
      packageField: 'fooConfig',
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'nested/one.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should handle failing plugins', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'malformed-plugin'),
      streamError: stderr.stream,
      globs: ['.'],
      packageField: 'fooConfig',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'one.txt',
          '  1:1  error  Error: Boom!'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should handle missing plugins', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'missing-plugin'),
      streamError: stderr.stream,
      globs: ['.'],
      packageField: 'fooConfig',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'one.txt',
          '  1:1  error  Error: Cannot find module `missing`'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should handle invalid plugins', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'not-a-plugin'),
      streamError: stderr.stream,
      globs: ['.'],
      packageField: 'fooConfig',
      extensions: ['txt']
    }, function (err, code) {
      var plugin = join(fixtures, 'not-a-plugin', 'test.js');

      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'one.txt',
          '  1:1  error  Error: Loading `' + plugin + '` should ' +
            'give a function, not `[object Object]`'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should handle throwing plugins', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'throwing-plugin'),
      streamError: stderr.stream,
      globs: ['.'],
      packageField: 'fooConfig',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'one.txt',
          '  1:1  error  Error: Missing `required`'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should handle injected plugins', function (st) {
    var stderr = spy();

    st.plan(5);

    engine({
      processor: noop,
      cwd: join(fixtures, 'one-file'),
      streamError: stderr.stream,
      globs: ['.'],
      injectedPlugins: [
        function (processor, options) {
          st.equal(options, undefined, 'should support a plug-in');
        },
        [
          function (processor, options) {
            st.deepEqual(
              options,
              {foo: 'bar'},
              'should support a plug-in--options tuple'
            );
          },
          {
            foo: 'bar'
          }
        ]
      ],
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(stderr(), 'one.txt: no issues found\n', 'should report');
    });
  });
});
