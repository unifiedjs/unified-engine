/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* Dependencies. */
var path = require('path');
var test = require('tape');
var noop = require('./util/noop-processor');
var spy = require('./util/spy');
var engine = require('..');

/* Methods. */
var join = path.join;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Tests. */
test('`configTransform`', function (t) {
  t.plan(1);

  t.test('should work', function (st) {
    var stderr = spy();

    st.plan(7);

    engine({
      processor: noop.use(function (processor) {
        processor.t = st;
      }),
      streamError: stderr.stream,
      cwd: join(fixtures, 'config-transform'),
      globs: ['.'],
      rcName: '.foorc',
      packageField: 'foo',
      configTransform: configTransform,
      extensions: ['txt']
    }, function (err, code, result) {
      var cache = result.configuration.cache;
      var keys = Object.keys(cache);

      st.error(err, 'should not fail fatally');
      st.equal(code, 0, 'should exit with `0`');
      st.equal(keys.length, 1, 'should have one cache entry');

      st.deepEqual(
        cache[keys[0]].settings,
        {
          charlie: true,
          bravo: true,
          alpha: true,
          foxtrot: true,
          echo: true,
          delta: true
        },
        'should set the correct settings'
      );

      st.deepEqual(
        cache[keys[0]].plugins[join(fixtures, 'config-transform', 'test.js')],
        {
          package: ['foo', 'bar', 'baz'],
          cascade: 5,
          script: true,
          nestedScript: true
        },
        'should pass the correct options to plugins'
      );

      st.equal(
        stderr(),
        'nested/one.txt: no issues found\n'
      );
    });

    function configTransform(raw) {
      return {
        settings: raw.options,
        plugins: raw.plugs
      };
    }
  });
});
