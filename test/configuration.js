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

  t.test(
    'should fail fatally when custom .rc files ' +
    'are not found',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'one-file'),
        globs: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      }, function (err, code) {
        var report = stderr().split('\n').slice(0, 2).join('\n');
        st.error(err, 'should not fail fatally');
        st.equal(code, 1, 'should exit with `1`');

        st.equal(
          report,
          [
            'one.txt',
            '  1:1  error  Error: Cannot read given file `.foorc`'
          ].join('\n'),
          'should fail'
        );
      });
    }
  );

  t.test(
    'should fail fatally when custom .rc files ' +
    'are malformed (empty)',
    function (st) {
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'malformed-rc-empty'),
        globs: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      }, function (err, code) {
        var report = stderr().split('\n').slice(0, 2).join('\n');
        st.error(err, 'should not fail fatally');
        st.equal(code, 1, 'should exit with `1`');

        st.equal(
          report,
          [
            'one.txt',
            '  1:1  error  Error: Cannot parse given file `.foorc`'
          ].join('\n'),
          'should fail'
        );
      });
    }
  );

  t.test(
    'should fail fatally when custom .rc files ' +
    'are malformed (invalid)',
    function (st) {
      var stderr = spy();

      st.plan(1);

      engine({
        processor: noop,
        streamError: stderr.stream,
        cwd: join(fixtures, 'malformed-rc-invalid'),
        globs: ['.'],
        rcPath: '.foorc.js',
        extensions: ['txt']
      }, function (err, code) {
        var report = stderr().split('\n').slice(0, 3).join('\n');

        st.deepEqual(
          [err, code, report],
          [
            null,
            1,
            [
              'one.txt',
              '  1:1  error  Error: Cannot parse given file `.foorc.js`',
              'Error: Expected preset, not `false`'
            ].join('\n')
          ],
          'should support valid .rc modules'
        );
      });
    }
  );

  t.test('should support `.rc.js` modules (1)', function (st) {
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
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        report,
        [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.js`'
        ].join('\n'),
        'should fail fatally when custom .rc files ' +
        'are malformed'
      );
    });
  });

  t.test('should support `.rc.js` modules (2)', function (st) {
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-module'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 2).join('\n');

      st.deepEqual(
        [err, code, report],
        [null, 0, 'one.txt: no issues found\n'],
        'should support valid .rc modules'
      );
    });
  });

  t.test('should support `.rc.js` modules (3)', function (st) {
    var stderr = spy();

    st.plan(1);

    require('./fixtures/rc-module/.foorc'); // eslint-disable-line import/no-unassigned-import

    engine({
      processor: noop,
      cwd: join(fixtures, 'rc-module'),
      streamError: stderr.stream,
      globs: ['.'],
      rcName: '.foorc',
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 2).join('\n');

      st.deepEqual(
        [err, code, report],
        [null, 0, 'one.txt: no issues found\n'],
        'should use Node’s module caching (coverage)'
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
        report,
        [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.yaml`'
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
          '  1:1  error  Error: Cannot parse file `package.json`'
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

  t.test('should not search if `detectConfig` is `false`', function (st) {
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
  });

  t.test('should cascade `settings`', function (st) {
    var stderr = spy();

    st.plan(4);

    function Parser(file, options) {
      st.deepEqual(options, {alpha: true}, 'should configure');
      this.value = file.toString();
    }

    Parser.prototype.parse = function () {
      return {type: 'text', value: this.value};
    };

    engine({
      processor: noop().use(function (processor) {
        processor.Parser = Parser;
      }),
      cwd: join(fixtures, 'config-settings'),
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
        'one.txt: no issues found\n',
        'should report'
      );
    });
  });
});
