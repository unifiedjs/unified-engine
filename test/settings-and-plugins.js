/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unified').CompilerFunction} CompilerFunction
 * @typedef {import('unist').Literal} Literal
 */

import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('settings', (t) => {
  t.plan(2)

  t.test('should use `settings`', (t) => {
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
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        settings: {alpha: true}
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should cascade `settings`', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          t.deepEqual(
            this.data('settings'),
            {alpha: false, bravo: 'charlie', delta: 1},
            'should configure'
          )

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
        cwd: path.join(fixtures, 'config-settings-cascade'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        rcName: '.foorc',
        settings: {alpha: false, bravo: 'charlie'}
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })
})

test('plugins', (t) => {
  t.plan(3)

  t.test('should use `plugins` as list of functions', (t) => {
    const stderr = spy()

    t.plan(3)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [
          function () {
            return function () {
              t.pass('transformer')
            }
          },
          [
            /** @param {unknown} options */
            function (options) {
              return function () {
                t.deepEqual(options, {alpha: true}, 'transformer')
              }
            },
            {alpha: true}
          ]
        ]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should use `plugins` as list of strings', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: path.join(fixtures, 'config-plugins-basic-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [
          './preset/index.js',
          ['./preset/plugin.js', {two: false, three: true}]
        ]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should use `plugins` as list of objects', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: path.join(fixtures, 'config-plugins-basic-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: {
          './preset/index.js': null,
          './preset/plugin.js': {two: false, three: true}
        }
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })
})
