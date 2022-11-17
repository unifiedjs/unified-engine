import assert from 'node:assert/strict'
import {sep} from 'node:path'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('configuration', async () => {
  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugin.
    globalThis.unifiedEngineTestCalls = 0

    engine(
      {
        processor: noop(),
        cwd: new URL('config-plugins-cascade/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'nested' + sep + 'one.txt: no issues found\n'],
          'should cascade `plugins`'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugin.
    globalThis.unifiedEngineTestCalls = 0

    engine(
      {
        processor: noop(),
        cwd: new URL('config-plugins-esm-mjs/', fixtures),
        streamError: stderr.stream,
        files: ['one.txt'],
        rcName: '.foorc'
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support an ESM plugin w/ an `.mjs` extname'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    // @ts-expect-error: incremented by plugin.
    globalThis.unifiedEngineTestCalls = 0

    engine(
      {
        processor: noop(),
        cwd: new URL('config-plugins-esm-js/', fixtures),
        streamError: stderr.stream,
        files: ['one.txt'],
        rcName: '.foorc'
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support an ESM plugin w/ a `.js` extname'
        )
        // @ts-expect-error: incremented by plugin.
        assert.equal(globalThis.unifiedEngineTestCalls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle failing plugins'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle plugins w/o `export default`'
        )

        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle missing plugins'
        )

        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle invalid plugins'
        )

        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

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

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should handle throwing plugins'
        )

        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const o = {foo: 'bar'}
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('one-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        plugins: [
          (/** @type {unknown} */ options) => {
            calls++
            assert.equal(options, undefined, 'should support a plugin')
          },
          [
            (/** @type {unknown} */ options) => {
              calls++
              assert.equal(options, o, 'should support a plugin--options tuple')
            },
            o
          ]
        ],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should handle injected plugins'
        )
        assert.equal(calls, 2)
        resolve(undefined)
      }
    )
  })
})
