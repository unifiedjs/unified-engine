'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('configuration-presets', function (t) {
  t.plan(7);

  t.test('should fail on missing `presets`', function (st) {
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop,
      cwd: join(fixtures, 'config-presets-missing'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var out = stderr().split('\n').slice(0, 2).join('\n');

      st.deepEqual(
        [err, code, out],
        [
          null,
          1,
          'nested/two.txt\n' +
          '  1:1  error  Error: Cannot read configuration file: ./preset'
        ],
        'should fail'
      );
    });
  });

  t.test('should fail on invalid `presets`', function (st) {
    var root = join(fixtures, 'config-presets-invalid');
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop,
      cwd: root,
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var out = stderr().split('\n').slice(0, 3).join('\n');

      st.deepEqual(
        [err, code, out.replace(path.join(root, 'preset.js'), '???')],
        [
          null,
          1,
          'nested/two.txt\n' +
          '  1:1  error  Error: Cannot read configuration file: ???\n' +
          'invalid'
        ],
        'should fail'
      );
    });
  });

  t.test('should supports `presets` as `string`', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-string'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'nested/two.txt: no issues found\n' +
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });

  t.test('should prefer local plugins', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-local'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'nested/two.txt: no issues found\n' +
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });

  t.test('should supports `presets` as `Array.<string>`', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-list'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'nested/two.txt: no issues found\n' +
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });

  t.test('should supports `presets` as `Object` (1)', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-object'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'nested/two.txt: no issues found\n' +
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });

  t.test('should supports `presets` as `Object` (2)', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-object-no-func'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'nested/two.txt: no issues found\n' +
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });
});
