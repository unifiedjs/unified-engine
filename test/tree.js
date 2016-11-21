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
test('tree', function (t) {
  t.plan(5);

  t.test('should fail on malformed input', function (st) {
    var cwd = join(fixtures, 'malformed-tree');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      treeIn: true,
      globs: ['doc.json']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr(true).split('\n').slice(0, 3).join('\n'),
        [
          'doc.json',
          '  1:1  error  TypeError: Cannot read file as JSON',
          'Invalid property descriptor. Cannot both specify ' +
          'accessors and a value or writable attribute, #<Object>'
        ].join('\n'),
        'should report'
      );
    });
  });

  t.test(
    'should read and write JSON when `tree` is given',
    function (st) {
      var cwd = join(fixtures, 'tree');
      var stderr = spy();

      st.plan(4);

      engine({
        processor: noop().use(function () {
          return function (tree) {
            /* Modify tree */
            tree.value = 'two';
          };
        }),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        tree: true,
        globs: ['doc']
      }, function (err, code) {
        var doc = read(join(cwd, 'doc.json'), 'utf8');

        /* Remove the file. */
        unlink(join(cwd, 'doc.json'));

        st.error(err, 'should not fail fatally');
        st.equal(code, 0, 'should exit with `0`');

        st.equal(
          stderr(true),
          'doc > doc.json: written\n',
          'should report'
        );

        st.equal(
          doc,
          '{\n  "type": "text",\n  "value": "two"\n}\n',
          'should write the transformed doc as JSON'
        );
      });
    }
  );

  t.test('should read JSON when `treeIn` is given', function (st) {
    var cwd = join(fixtures, 'tree');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Modify tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: true,
      treeIn: true,
      globs: ['doc'],
      extensions: ['foo']
    }, function (err, code) {
      var doc = read(join(cwd, 'doc.foo'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'doc.foo'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(true),
        'doc > doc.foo: written\n',
        'should report'
      );

      st.equal(
        doc,
        'two\n',
        'should write the transformed doc as `foo`'
      );
    });
  });

  t.test('should write JSON when `treeOut` is given', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop().use(function () {
        return function (tree) {
          /* Modify tree */
          tree.value = 'two';
        };
      }),
      cwd: cwd,
      streamError: stderr.stream,
      output: true,
      treeOut: true,
      globs: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var doc = read(join(cwd, 'one.json'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'one.json'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(true),
        'one.txt > one.json: written\n',
        'should report'
      );

      st.equal(
        doc,
        '{\n  "type": "text",\n  "value": "two"\n}\n',
        'should write the transformed doc as JSON'
      );
    });
  });

  t.test('should write injected files', function (st) {
    var cwd = join(fixtures, 'one-file');
    var stderr = spy();

    st.plan(3);

    engine({
      processor: noop,
      cwd: cwd,
      streamError: stderr.stream,
      output: 'bar.json',
      treeOut: true,
      files: [
        toVFile(join(cwd, 'one.txt'))
      ]
    }, function (err, code) {
      /* Remove the file. */
      unlink(join(cwd, 'bar.json'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(
        stderr(true),
        'one.txt > bar.json: written\n',
        'should report'
      );
    });
  });
});
