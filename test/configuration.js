'use strict';

var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;

var fixtures = join(__dirname, 'fixtures');

test('configuration', function (t) {
  t.plan(13);

  engine({
    processor: noop,
    cwd: join(fixtures, 'one-file'),
    globs: ['.'],
    rcPath: '.foorc',
    extensions: ['txt']
  }, function (err) {
    t.equal(
      err.message.slice(0, err.message.indexOf(':')),
      'Cannot read configuration file',
      'should fail fatally when custom .rc files ' +
      'are not found'
    );
  });

  engine({
    processor: noop,
    cwd: join(fixtures, 'malformed-rc'),
    globs: ['.'],
    rcPath: '.foorc',
    extensions: ['txt']
  }, function (err) {
    t.equal(
      err.message.slice(0, err.message.indexOf(':')),
      'Cannot read configuration file',
      'should fail fatally when custom .rc files ' +
      'are malformed'
    );
  });

  t.test('should support `.rc.js` modules', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'malformed-rc-module'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 2).join('\n');
      report = report.slice(0, report.lastIndexOf(':'));
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        report,
        [
          'one.txt',
          '  1:1  error  Error: Cannot read configuration file'
        ].join('\n'),
        'should fail fatally when custom .rc files ' +
        'are malformed'
      );
    });
  });

  t.test('should support `.rc.js` module functions', function (st) {
    var cwd = join(fixtures, 'rc-script-function');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code, result) {
      var cache = result.configuration.cache;

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(Object.keys(cache).length, 1, 'should have one cache entry');

      st.deepEqual(
        cache[cwd],
        {
          plugins: {},
          one: true,
          fromFunction: true
        },
        'should invoke scripts exposing functions (with current config)'
      );
    });
  });

  t.test('should support `.rc.yaml` modules', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'malformed-rc-yaml'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 2).join('\n');

      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        report.slice(0, report.lastIndexOf(':')),
        [
          'one.txt',
          '  1:1  error  Error: Cannot read configuration file'
        ].join('\n'),
        'should fail fatally when custom .rc files ' +
        'are malformed'
      );
    });
  });

  t.test('should support custom rc files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-file'),
      streamError: stderr.stream,
      globs: ['.'],
      rcPath: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/four.txt: no issues found',
          'nested/three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support searching package files', function (st) {
    var cwd = join(fixtures, 'malformed-package-file');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
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
          '  1:1  error  Error: Cannot read configuration file: ' +
            join(cwd, 'package.json')
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support custom rc files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-file'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/four.txt: no issues found',
          'nested/three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support no config files', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'simple-structure'),
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

  t.test('should fail on invalid `presets`', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-file'),
      streamError: stderr.stream,
      globs: ['.'],
      presets: {missing: null},
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'nested/four.txt',
          '  1:1  error  Error: Cannot read configuration file: missing'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test('should support given `presets`', function (st) {
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-file'),
      streamError: stderr.stream,
      globs: ['.'],
      presets: {
        './.foorc': null
      },
      extensions: ['txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        [
          'nested/four.txt: no issues found',
          'nested/three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test(
    'should not search if `detectConfig` is `false`',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop,
        cwd: join(fixtures, 'malformed-rc-module'),
        streamError: stderr.stream,
        globs: ['.'],
        extensions: ['txt'],
        detectConfig: false,
        rcName: '.foorc'
      }, function (err, code) {
        st.error(err, 'should not fail fatally');
        st.equal(code, 0, 'should exit with `0`');

        st.equal(
          stderr(),
          'one.txt: no issues found\n',
          'should not search for configuration of ' +
          '`detectConfig` is set to `false`'
        );
      });
    }
  );

  t.test('should cascade `settings`', function (st) {
    var stderr = spy();

    st.plan(4);

    function Parser(file, options) {
      st.deepEqual(
        options,
        {
          rc: true,
          script: true,
          yaml: true,
          package: true,
          nestedRc: true,
          nestedYAML: true,
          nestedScript: true,
          nestedPackage: true,
          cascade: 5 // `.rc` precedes over `.rc.js`,
          // `.rc.yaml`, and `package.json`.
        },
        'should correctly cascade settings'
      );

      this.value = file.toString();
    }

    Parser.prototype.parse = function () {
      return {type: 'text', value: this.value};
    };

    engine({
      processor: noop().use(function (processor) {
        processor.Parser = Parser;
      }),
      cwd: join(fixtures, 'config-settings-cascade'),
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
});
