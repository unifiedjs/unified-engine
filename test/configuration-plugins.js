'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('configuration', function(t) {
  t.plan(6)

  t.test('should cascade `plugins`', function(st) {
    var stderr = spy()

    /* One more assertions is loaded in a plugin. */
    st.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: join(fixtures, 'config-plugins-cascade'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'nested/one.txt: no issues found\n'],
        'should work'
      )
    }

    function addTest() {
      this.t = st
    }
  })

  t.test('should handle failing plugins', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'malformed-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 4)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `package.json`',
        'Cannot parse script `test.js`',
        'Error: Boom!'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should work')
    }
  })

  t.test('should handle missing plugins', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'missing-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Could not find module `missing`'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should work')
    }
  })

  t.test('should handle invalid plugins', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'not-a-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 3)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot parse file `package.json`',
        'Error: Expected preset or plugin, not false, at `test.js`'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should work')
    }
  })

  t.test('should handle throwing plugins', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'throwing-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Missing `required`'
      ].join('\n')

      st.deepEqual([err, code, actual], [null, 1, expected], 'should work')
    }
  })

  t.test('should handle injected plugins', function(st) {
    var stderr = spy()
    var o = {foo: 'bar'}

    st.plan(3)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        plugins: [checkMissingOptions, [checkTuple, o]],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code) {
      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should work'
      )
    }

    function checkMissingOptions(options) {
      st.equal(options, undefined, 'should support a plug-in')
    }

    function checkTuple(options) {
      st.equal(options, o, 'should support a plug-in--options tuple')
    }
  })
})
