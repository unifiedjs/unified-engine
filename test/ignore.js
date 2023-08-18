import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {join, relative, sep} from 'node:path'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from 'unified-engine'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('ignore', async function (t) {
  await t.test(
    'should fail fatally when given ignores are not found',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('simple-structure/', fixtures),
        detectIgnore: false,
        extensions: ['txt'],
        files: ['one.txt'],
        ignorePath: '.missing-ignore',
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        cleanError(stderr(), 4),
        [
          'one.txt',
          ' error Cannot find file',
          '  [cause]:',
          '    Error: Cannot read given file `.missing-ignore`'
        ].join('\n')
      )
    }
  )

  await t.test('should support custom ignore files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('ignore-file/', fixtures),
      detectIgnore: false,
      extensions: ['txt'],
      files: ['.'],
      ignorePath: '.fooignore',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test('should support searching ignore files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('ignore-file/', fixtures),
      detectIgnore: true,
      extensions: ['txt'],
      files: ['.'],
      ignoreName: '.fooignore',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test('should look into hidden files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('hidden-directory/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        '.hidden' + sep + 'two.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test('should not look into `node_modules`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('node-modules-directory/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
  })

  await t.test(
    'should look into `node_modules` w/ explicit search',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('node-modules-directory/', fixtures),
        extensions: ['txt'],
        files: ['node_modules/', '.'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          'node_modules' + sep + 'two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test('should support no ignore files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('simple-structure/', fixtures),
      detectIgnore: true,
      extensions: ['txt'],
      files: ['.'],
      ignoreName: '.fooignore',
      processor: noop,
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

  await t.test('should support ignore patterns', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('simple-structure/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      ignorePatterns: ['**/t*.*'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
  })

  await t.test(
    'should support ignore files and ignore patterns',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('ignore-file/', fixtures),
        detectIgnore: true,
        extensions: ['txt'],
        files: ['.'],
        ignoreName: '.fooignore',
        ignorePatterns: ['nested'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
    }
  )

  await t.test(
    '`ignorePath` should resolve from its folder, `ignorePatterns` from cwd',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('sibling-ignore/', fixtures),
        extensions: ['txt'],
        files: ['.'],
        ignorePath: join('deep', 'ignore'),
        ignorePatterns: ['files/two.txt'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          join('deep', 'files', 'two.txt') + ': no issues found',
          join('files', 'one.txt') + ': no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test('`ignorePathResolveFrom`', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('sibling-ignore/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      ignorePath: join('deep', 'ignore'),
      ignorePathResolveFrom: 'cwd',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        join('deep', 'files', 'one.txt') + ': no issues found',
        join('deep', 'files', 'two.txt') + ': no issues found',
        join('files', 'two.txt') + ': no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test('should support higher positioned files', async function () {
    const stderr = spy()
    const cwd = new URL('empty/', fixtures)
    const url = new URL('../../../example.txt', import.meta.url)

    await fs.writeFile(url, '')

    const code = await run({
      cwd,
      files: [url],
      processor: noop,
      streamError: stderr.stream
    })

    await fs.unlink(url)

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      relative(fileURLToPath(cwd), fileURLToPath(url)) + ': no issues found\n'
    )
  })
})
