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
      files: ['doc.json']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 1, 'should exit with `1`');

      st.equal(
        stderr().split('\n').slice(0, 2).join('\n'),
        [
          'doc.json',
          '  1:1  error  Error: Cannot read file as JSON'
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
        files: ['doc']
      }, function (err, code) {
        var doc = read(join(cwd, 'doc.json'), 'utf8');

        /* Remove the file. */
        unlink(join(cwd, 'doc.json'));

        st.error(err, 'should not fail fatally');
        st.equal(code, 0, 'should exit with `0`');

        st.equal(
          stderr(),
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
      files: ['doc'],
      extensions: ['foo']
    }, function (err, code) {
      var doc = read(join(cwd, 'doc.foo'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'doc.foo'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
        'doc > doc.foo: written\n',
        'should report'
      );

      st.equal(
        doc,
        'two',
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
      files: ['.'],
      extensions: ['txt']
    }, function (err, code) {
      var doc = read(join(cwd, 'one.json'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'one.json'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');

      st.equal(
        stderr(),
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
        vfile(join(cwd, 'one.txt'))
      ]
    }, function (err, code) {
      /* Remove the file. */
      unlink(join(cwd, 'bar.json'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(
        stderr(),
        'one.txt > bar.json: written\n',
        'should report'
      );
    });
  });
});
