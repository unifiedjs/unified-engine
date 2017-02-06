'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('configuration-presets', function (t) {
  t.plan(8);

  t.test('should fail on invalid `presets`', function (st) {
    var root = join(fixtures, 'config-presets-invalid');
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop,
      cwd: root,
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr().split('\n').slice(0, 3).join('\n')],
        [
          null,
          1,
          'one.txt\n' +
          '  1:1  error  Error: Cannot parse file `.foorc`\n' +
          'Expected a list or object of plugins, not `./preset`'
        ],
        'should fail'
      );
    });
  });

  t.test('should support plugins with the same name', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(3);

    engine({
      processor: noop().use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-presets-local'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [
          null,
          0,
          'one.txt: no issues found\n'
        ],
        'should succeed'
      );
    });
  });

  t.test('should handle missing plugins in presets', function (st) {
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop,
      cwd: join(fixtures, 'config-presets-missing-plugin'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr().split('\n').slice(0, 2).join('\n')],
        [null, 1, 'one.txt\n  1:1  error  Error: Could not find module `./plugin`'],
        'should succeed'
      );
    });
  });

  t.test('should reconfigure plugins', function (st) {
    var stderr = spy();

    /* One more assertion is loaded in the plugin. */
    st.plan(2);

    engine({
      processor: noop().use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-plugins-reconfigure'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      );
    });
  });

  t.test('should reconfigure required plugins', function (st) {
    var stderr = spy();

    /* One more assertion is loaded in the plugin. */
    st.plan(2);

    engine({
      processor: noop().use(function (processor) {
        processor.t = st;
      }),
      cwd: join(fixtures, 'config-preset-plugins-reconfigure'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      );
    });
  });

  t.test('Should reconfigure: turn plugins off', function (st) {
    var stderr = spy();

    /* More assertions are in loaded plugins. */
    st.plan(1);

    engine({
      processor: noop,
      cwd: join(fixtures, 'config-plugins-reconfigure-off'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      );
    });
  });

  t.test('should reconfigure settings', function (st) {
    var stderr = spy();

    Parser.prototype.parse = parse;

    st.plan(2);

    function attacher(proc) {
      proc.Parser = Parser;
    }

    function Parser(file, options) {
      st.deepEqual(options, {alpha: true}, 'should configure');
      this.value = file.toString();
    }

    function parse() {
      return {type: 'text', value: this.value};
    }

    engine({
      processor: noop().use(attacher),
      cwd: join(fixtures, 'config-settings-reconfigure-a'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      );
    });
  });

  t.test('should reconfigure settings (2)', function (st) {
    var stderr = spy();

    Parser.prototype.parse = parse;

    st.plan(2);

    function attacher(proc) {
      proc.Parser = Parser;
    }

    function Parser(file, options) {
      st.deepEqual(options, {alpha: true}, 'should configure');
      this.value = file.toString();
    }

    function parse() {
      return {type: 'text', value: this.value};
    }

    engine({
      processor: noop().use(attacher),
      cwd: join(fixtures, 'config-settings-reconfigure-b'),
      streamError: stderr.stream,
      files: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      );
    });
  });
});
