/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unist').Literal} Literal
 */

import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('configuration-presets', (t) => {
  t.plan(8)

  t.test('should fail on invalid `presets`', (t) => {
    const root = new URL('config-presets-invalid/', fixtures)
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
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-presets-local/', fixtures),
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

  t.test('should handle missing plugins in presets', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('config-presets-missing-plugin/', fixtures),
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
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-plugins-reconfigure/', fixtures),
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

  t.test('should reconfigure imported plugins', (t) => {
    const stderr = spy()

    // One more assertion is loaded in the plugin.
    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-preset-plugins-reconfigure/', fixtures),
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

  t.test('should reconfigure: turn plugins off', (t) => {
    const stderr = spy()

    // More assertions are in loaded plugins.
    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('config-plugins-reconfigure-off/', fixtures),
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
        processor: noop().use(function () {
          Object.assign(this, {
            /**
             * @type {ParserFunction}
             * @returns {Literal}
             */
            Parser(doc) {
              return {type: 'text', value: doc}
            }
          })

          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
        }),
        cwd: new URL('config-settings-reconfigure-a/', fixtures),
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
        processor: noop().use(function () {
          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')

          Object.assign(this, {
            /**
             * @type {ParserFunction}
             * @returns {Literal}
             */
            Parser(doc) {
              return {type: 'text', value: doc}
            }
          })
        }),
        cwd: new URL('config-settings-reconfigure-b/', fixtures),
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
