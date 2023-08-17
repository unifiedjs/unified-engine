/**
 * @typedef {import('unist').Literal} Literal
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {promisify} from 'node:util'
import {VFile} from 'vfile'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('tree', async function (t) {
  await t.test('should fail on malformed input', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('malformed-tree/', fixtures),
      files: ['doc.json'],
      processor: noop,
      streamError: stderr.stream,
      treeIn: true
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr(), 2),
      'doc.json\n error Cannot read file as JSON'
    )
  })

  await t.test(
    'should read and write JSON when `tree` is given',
    async function () {
      const cwd = new URL('tree/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        files: ['doc'],
        output: true,
        processor: noop().use(
          /** @type {import('unified').Plugin<[], Literal>} */
          function () {
            return function (tree) {
              tree.value = 'two'
            }
          }
        ),
        streamError: stderr.stream,
        tree: true
      })

      const doc = String(await fs.readFile(new URL('doc.json', cwd)))

      await fs.unlink(new URL('doc.json', cwd))

      assert.equal(code, 0)
      assert.equal(stderr(), 'doc > doc.json: written\n')
      assert.equal(doc, '{\n  "type": "text",\n  "value": "two"\n}\n')
    }
  )

  await t.test('should read JSON when `treeIn` is given', async function () {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['foo'],
      files: ['doc'],
      output: true,
      processor: noop().use(
        /** @type {import('unified').Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      treeIn: true
    })

    const doc = String(await fs.readFile(new URL('doc.foo', cwd)))

    await fs.unlink(new URL('doc.foo', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'doc > doc.foo: written\n')
    assert.equal(doc, 'two')
  })

  await t.test('should write JSON when `treeOut` is given', async function () {
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
      streamError: stderr.stream,
      treeOut: true
    })

    const doc = String(await fs.readFile(new URL('one.json', cwd)))

    await fs.unlink(new URL('one.json', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt > one.json: written\n')
    assert.equal(doc, '{\n  "type": "text",\n  "value": "two"\n}\n')
  })

  await t.test('should support `treeOut` for stdin', async function () {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setImmediate(send)

    const code = await run({
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream,
      treeOut: true
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '{\n  "type": "text",\n  "value": "\\n"\n}\n')

    function send() {
      stdin.end('\n')
    }
  })

  await t.test('should support `treeIn` for stdin', async function () {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setImmediate(send)

    const code = await run({
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream,
      treeIn: true
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '\n')

    function send() {
      stdin.end('{"type":"text","value":"\\n"}')
    }
  })

  await t.test('should write injected files', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      files: [new VFile(new URL('one.txt', cwd))],
      output: 'bar.json',
      processor: noop,
      streamError: stderr.stream,
      treeOut: true
    })

    await fs.unlink(new URL('bar.json', cwd))

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt > bar.json: written\n')
  })
})
