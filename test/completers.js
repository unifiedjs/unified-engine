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
test('completers', function (t) {
  t.plan(2);

  t.test('should pass `fileSet` to plug-ins', function (st) {
    var stderr = spy();

    /* 5 in the attacher, which is invoked 2 times,
     * 1 in `testSet`, which is invoked 2 times,
     * 3 in the callback. */
    st.plan(15);

    function testSet(set, nr) {
      var paths = set.files.map(function (file) {
        return file.path;
      });

      st.deepEqual(
        paths,
        [
          'one.txt',
          'two.txt'
        ],
        'should expose the files and set to ' +
        '`completer` (' + nr + ')'
      );
    }

    function completer(set) {
      testSet(set, 1);
    }

    engine({
      processor: noop,
      streamError: stderr.stream,
      injectedPlugins: [
        function (processor, settings, set) {
          st.equal(
            typeof set,
            'object',
            'should pass a set'
          );

          st.equal(
            typeof set.use,
            'function',
            'should have a `use` method'
          );

          st.equal(
            typeof set.add,
            'function',
            'should have an `add` method'
          );

          /* The completer is added multiple times,
           * but it’s detected that its the same
           * function so it’s run once. */
          st.equal(
            set.use(completer),
            set,
            'should be able to `use` a completer'
          );

          /* Most often, completers cannot be
           * detected to be the same because
           * they’re created inside attachers.
           * `pluginId` can be used for those
           * to ensure the completer runs once.
           */
          function otherCompleter(subset) {
            testSet(subset, 2);
          }

          otherCompleter.pluginId = 'foo';

          set.use(otherCompleter);

          /* First, this plug-in is attached for
           * `one.txt`, where it adds `two.txt`.
           * Then, this plug-in is attached for
           * `two.txt`, but it doesn’t re-add
           * `two.txt` as it’s already added. */
          st.equal(
            set.add('two.txt'),
            set,
            'should be able to `add` a file'
          );
        }
      ],
      cwd: join(fixtures, 'two-files'),
      globs: ['one.txt']
    }, function (err, code) {
      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(
        stderr(),
        'one.txt: no issues found\n',
        'should report only given files'
      );
    });
  });

  t.test('should pass `fileSet` to plug-ins', function (st) {
    var cwd = join(fixtures, 'extensions');
    var stderr = spy();

    st.plan(4);

    engine({
      processor: noop,
      streamError: stderr.stream,
      injectedPlugins: [
        function (processor, settings, set) {
          /* Add a file. */
          set.add('bar.text');
        }
      ],
      cwd: cwd,
      globs: ['foo.txt'],
      output: 'nested/'
    }, function (err, code) {
      var doc = read(join(cwd, 'nested', 'foo.txt'), 'utf8');

      /* Remove the file. */
      unlink(join(cwd, 'nested', 'foo.txt'));

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(doc, '', 'should write given files');
      st.equal(
        stderr(),
        'foo.txt > nested/foo.txt: written\n',
        'should report only given files'
      );
    });
  });
});
