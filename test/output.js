/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* Dependencies. */
var fs = require('fs');
var path = require('path');
var test = require('tape');
var toVFile = require('to-vfile');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

/* Methods. */
var join = path.join;
var read = fs.readFileSync;
var unlink = fs.unlinkSync;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Tests. */
test('output', function (t) {
  t.plan(11);

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
      globs: ['.'],
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
      globs: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      st.equal(stdout(), 'two\n', 'should write');
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
      globs: ['one.txt'],
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
      globs: ['.'],
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
      globs: ['.'],
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

      st.equal(doc, 'two\n', 'should write the transformed doc');
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
      globs: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');
      var output = read(join(cwd, 'four.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'four.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(true),
        'one.txt > four.txt: written\n',
        'should report'
      );

      st.equal(input, '', 'should not modify the input');
      st.equal(output, 'two\n', 'should write the transformed doc');
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
      globs: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');
      var output = read(join(cwd, 'nested', 'one.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'nested', 'one.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(true),
        'one.txt > nested/one.txt: written\n',
        'should report'
      );

      st.equal(input, '', 'should not modify the input');
      st.equal(output, 'two\n', 'should write the transformed doc');
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
      files: [toVFile(join(cwd, 'one.txt'))]
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');

      /* Reset the file. */
      fs.truncateSync(join(cwd, 'one.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(stderr(), 'one.txt: written\n', 'should not report');
      st.equal(input, 'two\n', 'should not modify the input');
    });
  });

  t.test('should not write without file-path', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(4);

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
      globs: ['one.txt'],
      extensions: ['txt']
    }, function (err, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8');

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(input, '', 'should not modify the input');
      st.equal(
        stderr(true),
        '<stdin>: no issues found\n',
        'should not report'
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
      globs: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var report = stderr(true).split('\n').slice(0, 2);

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
        globs: ['.'],
        extensions: ['txt']
      }, function (err, code) {
        var report = stderr(true).split('\n').slice(0, 3);

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
