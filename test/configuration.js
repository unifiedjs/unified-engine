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

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: new URL('one-file/', fixtures),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot read given file `.foorc`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail fatally when custom rc files are missing'
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
        streamError: stderr.stream,
        cwd: new URL('malformed-rc-empty/', fixtures),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')
        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse given file `.foorc`'
        ].join('\n')
        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail fatally when custom rc files are empty'
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
        streamError: stderr.stream,
        cwd: new URL('malformed-rc-invalid/', fixtures),
        files: ['.'],
        rcPath: '.foorc.js',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 3).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse given file `.foorc.js`',
          'Error: Expected preset, not `false`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail fatally when custom rc files are invalid'
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
        cwd: new URL('malformed-rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.js`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should support `.rc.js` scripts (1)'
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
        cwd: new URL('rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support `.rc.js` scripts (2)'
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
        cwd: new URL('rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support `.rc.js` scripts (3)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('rc-module-mjs/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            return () => {
              assert.deepEqual(
                this.data('settings'),
                {foo: 'bar'},
                'should process files w/ settings'
              )
              calls++
            }
          }
        ]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support `.rc.mjs` module'
        )
        assert.equal(calls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('rc-module-cjs/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            return () => {
              assert.deepEqual(
                this.data('settings'),
                {foo: 'bar'},
                'should process files w/ settings'
              )
              calls++
            }
          }
        ]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support `.rc.cjs` module'
        )
        assert.equal(calls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('malformed-rc-yaml/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.yaml`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should support `.rc.yaml` config files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('rc-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            const settings = this.data('settings')
            return () => {
              assert.deepEqual(
                settings,
                {foo: 'bar'},
                'should process files w/ settings'
              )
              calls++
            }
          }
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'four.txt: no issues found',
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support custom rc files'
        )
        assert.equal(calls, 4)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('malformed-package-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should support searching package files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop,
        cwd: new URL('rc-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            return () => {
              assert.deepEqual(
                this.data('settings'),
                {foo: 'bar'},
                'should process files w/ settings'
              )
              calls++
            }
          }
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'four.txt: no issues found',
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support custom rc files'
        )
        assert.equal(calls, 4)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('simple-structure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'nested' + sep + 'two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support no config files'
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
        cwd: new URL('malformed-rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        detectConfig: false,
        rcName: '.foorc'
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should not search for config if `detectConfig` is set to `false`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    let calls = 0

    engine(
      {
        processor: noop().use(function () {
          assert.deepEqual(
            this.data('settings'),
            {alpha: true},
            'should configure'
          )
          calls++
        }),
        cwd: new URL('config-settings/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should cascade `settings`'
        )
        assert.equal(calls, 1)
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop(),
        cwd: new URL('config-monorepo-package/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 4).join('\n')
        const expected = [
          'packages' + sep + 'deep' + sep + 'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`',
          'Cannot import `plugin.js`',
          'Error: Boom!'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should ignore unconfigured `packages.json`'
        )
        resolve(undefined)
      }
    )
  })
})
