'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tape');
var vfile = require('to-vfile');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

var join = path.join;
var read = fs.readFileSync;
var unlink = fs.unlinkSync;

var fixtures = join(__dirname, 'fixtures');

test('output', function (t) {
  t.plan(12);

  t.test('should not write to stdout on dirs', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stdout = spy();
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      st.equal(stdout(), '', 'should write');
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should write to stdout on one file', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stdout = spy();
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      st.equal(stdout(), 'two', 'should write');
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should not write to stdout without `out`', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stdout = spy();
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      streamOut: stdout.stream,
      out: false,
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      st.equal(stdout(), '', 'should not write');
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should not write multiple files to stdout', function (st) {
    var cwd = join(fixtures, 'two-files');
    var stdout = spy();
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      streamOut: stdout.stream,
      streamError: stderr.stream,
      cwd: cwd,
      out: false,
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      st.equal(stdout(), '', 'should not write');
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: no issues found\n' +
        'two.txt: no issues found\n',
        'should report'
      );
    });
  });

  t.test('should output files', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: true,
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var doc = read(join(cwd, 'one.txt'), 'utf8');

      /* Reset the file. */
      fs.truncateSync(join(cwd, 'one.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt: written\n',
        'should report'
      );

      st.equal(doc, 'two', 'should write the transformed doc');
    });
  });

  t.test('should write to a path', function (st) {
    var cwd = join(fixtures, 'simple-structure');
    var stderr = spy();

    st.plan(5);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: 'four.txt',
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');
      var output = read(join(cwd, 'four.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'four.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt > four.txt: written\n',
        'should report'
      );

      st.equal(input, '', 'should not modify the input');
      st.equal(output, 'two', 'should write the transformed doc');
    });
  });

  t.test('should write to directories', function (st) {
    var cwd = join(fixtures, 'simple-structure');
    var stderr = spy();

    st.plan(5);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: 'nested/',
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');
      var output = read(join(cwd, 'nested', 'one.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'nested', 'one.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'one.txt > nested/one.txt: written\n',
        'should report'
      );

      st.equal(input, '', 'should not modify the input');
      st.equal(output, 'two', 'should write the transformed doc');
    });
  });

  t.test('should not create intermediate directories', function (st) {
    var cwd = join(fixtures, 'simple-structure');
    var stderr = spy();

    st.plan(1);

    engine({
      processor: noop(),
      cwd: cwd,
      streamError: stderr.stream,
      output: 'missing/bar',
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 3).join('\n');
      var fp = join(cwd, 'missing');

      st.deepEqual(
        [err, code, report],
        [
          null,
          1,
          [
            'one.txt',
            '  1:1  error  Error: Cannot read parent directory. Error:',
            'ENOENT: no such file or directory, stat \'' + fp + '\''
          ].join('\n')
        ],
        'should report'
      );
    });
  });

  t.test('should write injected files', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Change the tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: true,
      files: [vfile(join(cwd, 'one.txt'))]
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');

      /* Reset the file. */
      fs.truncateSync(join(cwd, 'one.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(stderr(), 'one.txt: written\n', 'should not report');
      st.equal(input, 'two', 'should not modify the input');
    });
  });

  t.test('should not write without file-path', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(2);

    engine({
      processor: noop().use(function () {
        return function (tree, file) {
          /* Change the tree */
          tree.value = 'two';

          /* Remove the file-path. */
          file.history = [];
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: true,
      files: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');

      st.equal(input, '', 'should not modify the input');

      st.deepEqual(
        [err, code, stderr().split('\n').slice(0, 2).join('\n')],
        [
          null,
          1,
          [
            '<stdin>',
            '  1:1  error  Error: Cannot write file without an output path '
          ].join('\n')
        ]
      );
    });
  });

  t.test('should fail when writing files to one path', function (st) {
    var cwd = join(fixtures, 'two-files');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      output: 'three.txt',
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr().split('\n').slice(0, 2);

      report[1] = report[1].slice(0, report[1].lastIndexOf(':'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        report.join('\n'),
        'one.txt\n' +
        '  1:1  error  Error: Cannot write multiple files to ' +
          'single output',
        'should report'
      );
    });
  });

  t.test(
    'should fail when writing to non-existent dirs',
    function (st) {
      var cwd = join(fixtures, 'two-files');
      var stderr = spy();

      st.plan(3);

      engine({
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        output: 'three/',
        files: ['.'],
        extensions: ['txt']
      }, function (err, code) {
        var report = stderr().split('\n').slice(0, 3);

        report[2] = report[2].slice(0, report[2].indexOf('ENOENT'));

        st.error(err, 'should not fail fatally');
        st.equal(code, 1, 'should exit with `1`');

        st.equal(
          report.join('\n'),
          'one.txt\n' +
          '  1:1  error  Error: Cannot read output directory. Error:\n',
          'should report'
        );
      });
    }
  );
});
