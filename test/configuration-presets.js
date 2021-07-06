/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unist').Literal} Literal
 */

import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('configuration-presets', (t) => {
  t.plan(8)

  t.test('should fail on invalid `presets`', (t) => {
    const root = path.join(fixtures, 'config-presets-invalid')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: root,
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 3).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc`',
          'Expected a list or object of plugins, not `./preset`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should support plugins with the same name', (t) => {
    const stderr = spy()

    // More assertions are in loaded plugins.
    t.plan(3)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(addTest),
        cwd: path.join(fixtures, 'config-presets-local'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )

    function addTest() {
      // Used in test.
      // type-coverage:ignore-next-line
      this.t = t
    }
  })

  t.test('should handle missing plugins in presets', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'config-presets-missing-plugin'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Could not find module `./plugin.js`'
        ].join('\n')

        t.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should succeed'
        )
      }
    )
  })

  t.test('should reconfigure plugins', (t) => {
    const stderr = spy()

    // Five more assertions are loaded in the plugin.
    t.plan(6)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(addTest),
        cwd: path.join(fixtures, 'config-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )

    function addTest() {
      // Used in test.
      // type-coverage:ignore-next-line
      this.t = t
    }
  })

  t.test('should reconfigure imported plugins', (t) => {
    const stderr = spy()

    // One more assertion is loaded in the plugin.
    t.plan(2)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(addTest),
        cwd: path.join(fixtures, 'config-preset-plugins-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )

    function addTest() {
      // Used in test.
      // type-coverage:ignore-next-line
      this.t = t
    }
  })

  t.test('Should reconfigure: turn plugins off', (t) => {
    const stderr = spy()

    // More assertions are in loaded plugins.
    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'config-plugins-reconfigure-off'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )
  })

  t.test('should reconfigure settings', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(function () {
          /**
           * @type {ParserFunction}
           * @returns {Literal}
           */
          this.Parser = function (doc) {
            return {type: 'text', value: doc}
          }

          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
        }),
        cwd: path.join(fixtures, 'config-settings-reconfigure-a'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )
  })

  t.test('should reconfigure settings (2)', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(function () {
          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
          /**
           * @type {ParserFunction}
           * @returns {Literal}
           */
          this.Parser = function (doc) {
            return {type: 'text', value: doc}
          }
        }),
        cwd: path.join(fixtures, 'config-settings-reconfigure-b'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should succeed'
        )
      }
    )
  })
})
