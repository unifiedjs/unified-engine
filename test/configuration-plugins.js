import {sep} from 'node:path'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('configuration', (t) => {
  t.plan(9)

  t.test('should cascade `plugins`', (t) => {
    const stderr = spy()

    // One more assertions is loaded in a plugin.
    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-plugins-cascade/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'nested' + sep + 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )
  })

  t.test('should support an ESM plugin w/ an `.mjs` extname', (t) => {
    const stderr = spy()

    // One more assertions is loaded in a plugin.
    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-plugins-esm-mjs/', fixtures),
        streamError: stderr.stream,
        files: ['one.txt'],
        rcName: '.foorc'
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )
  })

  t.test('should support an ESM plugin w/ a `.js` extname', (t) => {
    const stderr = spy()

    // One more assertions is loaded in a plugin.
    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          Object.assign(this, {t})
        }),
        cwd: new URL('config-plugins-esm-mjs/', fixtures),
        streamError: stderr.stream,
        files: ['one.txt'],
        rcName: '.foorc'
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )
  })

  t.test('should handle failing plugins', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('malformed-plugin/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 4).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`',
          'Cannot import `test.js`',
          'Error: Boom!'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should work')
      }
    )
  })

  t.test('should handle plugins w/o `export default`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('plugin-without-default/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 4).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`',
          'Cannot import `test.js`',
          'Error: Expected a plugin or preset exported as the default export'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should work')
      }
    )
  })

  t.test('should handle missing plugins', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('missing-plugin/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Could not find module `missing`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should work')
      }
    )
  })

  t.test('should handle invalid plugins', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('not-a-plugin/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 3).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`',
          'Error: Expected preset or plugin, not false, at `test.js`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should work')
      }
    )
  })

  t.test('should handle throwing plugins', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('throwing-plugin/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Missing `required`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should work')
      }
    )
  })

  t.test('should handle injected plugins', (t) => {
    const stderr = spy()
    const o = {foo: 'bar'}

    t.plan(3)

    engine(
      {
        processor: noop,
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        plugins: [
          (/** @type {unknown} */ options) => {
            t.equal(options, undefined, 'should support a plugin')
          },
          [
            (/** @type {unknown} */ options) => {
              t.equal(options, o, 'should support a plugin--options tuple')
            },
            o
          ]
        ],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )
  })
})
