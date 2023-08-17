/**
 * @typedef {import('unist').Literal} Literal
 *
 * @typedef {import('./types.js').SomeCustomResultExample} SomeCustomResultExample
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {sep} from 'node:path'
import test from 'node:test'
import {promisify} from 'node:util'
import {VFile} from 'vfile'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('output', async function (t) {
  await t.test('should not write to stdout on dirs', async function () {
    const stderr = spy()
    const stdout = spy()

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(stdout(), '')
  })

  await t.test('should write to stdout on one file', async function () {
    const stdout = spy()
    const stderr = spy()

    const code = await run({
      cwd: new URL('one-file/', fixtures),
      extensions: ['txt'],
      files: ['one.txt'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(stdout(), 'two')
  })

  await t.test('should not write to stdout without `out`', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      out: false,
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(stdout(), '')
  })

  await t.test('should not write multiple files to stdout', async function () {
    const cwd = new URL('two-files/', fixtures)
    const stdout = spy()
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['.'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream,
      out: false
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      'one.txt: no issues found\ntwo.txt: no issues found\n'
    )
    assert.equal(stdout(), '')
  })

  await t.test('should output files', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['.'],
      output: true,
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream
    })

    const url = new URL('one.txt', cwd)
    const doc = String(await fs.readFile(url))
    await fs.truncate(url)

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: written\n')
    assert.equal(doc, 'two')
  })

  await t.test('should write to a path', async function () {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      output: 'four.txt',
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream
    })

    const input = String(await fs.readFile(new URL('one.txt', cwd)))
    const output = String(await fs.readFile(new URL('four.txt', cwd)))

    await fs.unlink(new URL('four.txt', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt > four.txt: written\n')
    assert.equal(input, '')
    assert.equal(output, 'two')
  })

  await t.test('should write to directories', async function () {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      output: 'nested/',
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream
    })

    const input = String(await fs.readFile(new URL('one.txt', cwd)))
    const output = String(await fs.readFile(new URL('nested/one.txt', cwd)))

    await fs.unlink(new URL('nested/one.txt', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt > nested' + sep + 'one.txt: written\n')
    assert.equal(input, '')
    assert.equal(output, 'two')
  })

  await t.test('should not create intermediate directories', async function () {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      output: 'missing/bar',
      processor: noop(),
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        'one.txt',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot access parent folder'
      ].join('\n')
    )
  })

  await t.test('should write injected files', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      files: [new VFile(new URL('one.txt', cwd))],
      output: true,
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream
    })

    const doc = String(await fs.readFile(new URL('one.txt', cwd)))

    await fs.truncate(new URL('one.txt', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: written\n')
    assert.equal(doc, 'two')
  })

  await t.test('should not write without file-path', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      output: true,
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree, file) {
            tree.value = 'two'
            file.history = []
          }
        }
      ),
      streamError: stderr.stream
    })

    const doc = String(await fs.readFile(new URL('one.txt', cwd)))

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 4),
      [
        '<stdin>',
        ' error Cannot process file',
        '  [cause]:',
        '    Error: Cannot write file without an output path'
      ].join('\n')
    )
    assert.equal(doc, '')
  })

  await t.test('should fail when writing files to one path', async function () {
    const cwd = new URL('two-files/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['.'],
      output: 'three.txt',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.match(stderr(), /Cannot write multiple files to single output/)
  })

  await t.test(
    'should fail when writing to non-existent dirs',
    async function () {
      const cwd = new URL('two-files/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        extensions: ['txt'],
        files: ['.'],
        output: 'three' + sep,
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
          '    Error: Cannot read output folder'
        ].join('\n')
      )
    }
  )

  await t.test(
    'should not create a new file when input file does not exist',
    async function () {
      const cwd = new URL('empty/', fixtures)
      const targetFile = new URL('one.txt', cwd)
      const stderr = spy()

      await fs.mkdir(cwd, {recursive: true})

      const code = await run({
        cwd,
        extensions: ['txt'],
        files: ['one.txt'],
        output: true,
        processor: noop(),
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        cleanError(stderr(), 2),
        ['one.txt', ' error No such file or directory'].join('\n')
      )

      try {
        await fs.readFile(targetFile)
        assert.fail()
      } catch (error) {
        assert.match(String(error), /no such file or directory/)
      }
    }
  )

  await t.test('should write buffers', async function () {
    const cwd = new URL('filled-file/', fixtures)
    const stderr = spy()
    const stdout = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal, Uint8Array>} */
        // @ts-expect-error: TS doesn’t get `this`.
        function () {
          /** @type {import('unified').Compiler<Literal, Uint8Array>} */
          this.compiler = function () {
            return new TextEncoder().encode('Hi! 🤷‍♂️')
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(stdout(), 'Hi! 🤷‍♂️')
  })

  await t.test('should ignore nullish compilers', async function () {
    const cwd = new URL('filled-file/', fixtures)
    const stderr = spy()
    const stdout = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal, string>} */
        // @ts-expect-error: TS doesn’t get `this`.
        function () {
          /** @type {import('unified').Compiler<Literal, any>} */
          this.compiler = function () {
            // This would need to be typed in `CompileResults`.
            return undefined
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    // The `trim` is for windows.
    assert.equal(stdout().trim(), 'alpha')
  })

  await t.test('should ignore non-text compilers', async function () {
    const cwd = new URL('filled-file/', fixtures)
    const stderr = spy()
    const stdout = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['one.txt'],
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal, SomeCustomResultExample>} */
        // @ts-expect-error: TS doesn’t get `this`.
        function () {
          /** @type {import('unified').Compiler<Literal, SomeCustomResultExample>} */
          this.compiler = function () {
            return {kind: 'some-virtual-dom'}
          }
        }
      ),
      streamError: stderr.stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    // The `trim` is for windows.
    assert.equal(stdout().trim(), 'alpha')
  })
})
