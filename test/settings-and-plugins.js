'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('settings', function (t) {
  t.plan(2);

  t.test('should use `settings`', function (st) {
    var stderr = spy();

    st.plan(2);

    Parser.prototype.parse = parse;

    engine({
      processor: noop().use(attacher),
      cwd: join(fixtures, 'one-file'),
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      settings: {alpha: true}
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      );
    });

    function attacher(processor) {
      processor.Parser = Parser;
    }

    function Parser(file, options) {
      st.deepEqual(options, {alpha: true}, 'should configure');

      this.value = file.toString();
    }

    function parse() {
      return {type: 'text', value: this.value};
    }
  });

  t.test('should cascade `settings`', function (st) {
    var stderr = spy();

    st.plan(2);

    Parser.prototype.parse = parse;

    engine({
      processor: noop().use(attacher),
      cwd: join(fixtures, 'config-settings-cascade'),
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      rcName: '.foorc',
      settings: {alpha: false, bravo: 'charlie'}
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      );
    });

    function attacher(processor) {
      processor.Parser = Parser;
    }

    function Parser(file, options) {
      st.deepEqual(
        options,
        {alpha: false, bravo: 'charlie', delta: 1},
        'should configure'
      );

      this.value = file.toString();
    }

    function parse() {
      return {type: 'text', value: this.value};
    }
  });
});

test('plugins', function (t) {
  t.plan(3);

  t.test('should use `plugins` as list of functions', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'one-file'),
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      plugins: [one, [two, {alpha: true}]]
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      );
    });

    function one() {
      return transformer;
      function transformer() {
        st.pass('transformer');
      }
    }

    function two(proc, options) {
      return transformer;
      function transformer() {
        st.deepEqual(options, {alpha: true}, 'transformer');
      }
    }
  });

  t.test('should use `plugins` as list of strings', function (st) {
    var stderr = spy();

    st.plan(2);

    engine({
      processor: noop().use(function (proc) {
        proc.t = st;
      }),
      cwd: join(fixtures, 'config-plugins-reconfigure'),
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      plugins: ['./preset', ['./preset/plugin', {two: false, three: true}]]
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      );
    });
  });

  t.test('should use `plugins` as list of objects', function (st) {
    var stderr = spy();

    st.plan(2);

    engine({
      processor: noop().use(function (proc) {
        proc.t = st;
      }),
      cwd: join(fixtures, 'config-plugins-reconfigure'),
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt'],
      plugins: {
        './preset': null,
        './preset/plugin': {two: false, three: true}
      }
    }, function (err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      );
    });
  });
});
