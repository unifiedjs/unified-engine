import assert from 'node:assert/strict'
import {sep} from 'node:path'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('configuration', async function (t) {
  await t.test(
    'should fail fatally when custom rc files are missing',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('one-file/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop,
        rcPath: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        cleanError(stderr(), 4),
        [
          'one.txt',
          ' error Cannot process file',
          '  [cause]:',
          '    Error: Cannot read given file `.foorc`'
        ].join('\n')
      )
    }
  )

  await t.test(
    'should fail fatally when custom rc files are empty',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('malformed-rc-empty/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop,
        rcPath: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        cleanError(stderr(), 4),
        [
          'one.txt',
          ' error Cannot process file',
          '  [cause]:',
          '    Error: Cannot parse given file `.foorc`'
        ].join('\n')
      )
    }
  )

  await t.test(
    'should fail fatally when custom rc files are invalid',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('malformed-rc-invalid/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        processor: noop,
        rcPath: '.foorc.js',
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        cleanError(stderr(), 4),
        [
          'one.txt',
          ' error Cannot process file',
          '  [cause]:',
          '    Error: Cannot parse given file `.foorc.js`'
        ].join('\n')
      )
    }
  )

  await t.test('should support `.rc.js` scripts (1)', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('malformed-rc-script/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })
    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `.foorc.js`'
      ].join('\n')
    )
  })

  await t.test('should support `.rc.js` scripts (2)', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('rc-script/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })
    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
  })

  await t.test('should support `.rc.js` scripts (3)', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('rc-script/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })
    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
  })

  await t.test('should support `.rc.mjs` module', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('rc-module-mjs/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        function () {
          assert.deepEqual(this.data('settings'), {foo: 'bar'})
          calls++
        }
      ],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
  })

  await t.test('should support `.rc.cjs` module', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('rc-module-cjs/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        function () {
          assert.deepEqual(this.data('settings'), {foo: 'bar'})
          calls++
        }
      ],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })
    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
  })

  await t.test('should support `.rc.yaml` config files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('malformed-rc-yaml/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })
    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `.foorc.yaml`'
      ].join('\n')
    )
  })

  await t.test('should support custom rc files', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('rc-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        function () {
          const settings = this.data('settings')
          return function () {
            assert.deepEqual(settings, {foo: 'bar'})
            calls++
          }
        }
      ],
      processor: noop,
      rcPath: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'four.txt: no issues found',
        'nested' + sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        'two.txt: no issues found',
        ''
      ].join('\n')
    )
    assert.equal(calls, 4)
  })

  await t.test('should support searching package files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('malformed-package-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `package.json`'
      ].join('\n')
    )
  })

  await t.test('should support custom rc files', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('rc-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      plugins: [
        function () {
          const self = this

          return function () {
            assert.deepEqual(self.data('settings'), {foo: 'bar'})
            calls++
          }
        }
      ],
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'four.txt: no issues found',
        'nested' + sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        'two.txt: no issues found',
        ''
      ].join('\n')
    )
    assert.equal(calls, 4)
  })

  await t.test('should support no config files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('simple-structure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'nested' + sep + 'two.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should not search for config if `detectConfig` is set to `false`',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('malformed-rc-script/', fixtures),
        detectConfig: false,
        extensions: ['txt'],
        files: ['.'],
        processor: noop,
        rcName: '.foorc',
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
    }
  )

  await t.test('should cascade `settings`', async function () {
    const stderr = spy()
    let calls = 0

    const code = await run({
      cwd: new URL('config-settings/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(function () {
        assert.deepEqual(this.data('settings'), {alpha: true})
        calls++
      }),
      packageField: 'fooConfig',
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
  })

  await t.test('should ignore unconfigured `packages.json`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('config-monorepo-package/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      packageField: 'fooConfig',
      processor: noop(),
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'packages' + sep + 'deep' + sep + 'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot parse file `package.json`'
      ].join('\n')
    )
  })
})
