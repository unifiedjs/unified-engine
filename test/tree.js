/**
 * @import {Literal} from 'unist'
 * @import {Plugin} from 'unified'
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {VFile} from 'vfile'
import {engine} from 'unified-engine'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('tree', async function (t) {
  await t.test('should fail on malformed input', async function () {
    const stderr = spy()

    const result = await engine({
      cwd: new URL('malformed-tree/', fixtures),
      files: ['doc.json'],
      processor: noop,
      streamError: stderr.stream,
      treeIn: true
    })

    assert.equal(result.code, 1)
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

      const result = await engine({
        cwd,
        files: ['doc'],
        output: true,
        processor: noop().use(
          /** @type {Plugin<[], Literal>} */
          function () {
            return function (tree) {
              tree.value = 'two'
            }
          }
        ),
        streamError: stderr.stream,
        tree: true
      })

      const document = String(await fs.readFile(new URL('doc.json', cwd)))

      await fs.unlink(new URL('doc.json', cwd))

      assert.equal(result.code, 0)
      assert.equal(stderr(), 'doc > doc.json: written\n')
      assert.equal(document, '{\n  "type": "text",\n  "value": "two"\n}\n')
    }
  )

  await t.test('should read JSON when `treeIn` is given', async function () {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    const result = await engine({
      cwd,
      extensions: ['foo'],
      files: ['doc'],
      output: true,
      processor: noop().use(
        /** @type {Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      treeIn: true
    })

    const document = String(await fs.readFile(new URL('doc.foo', cwd)))

    await fs.unlink(new URL('doc.foo', cwd))

    assert.equal(result.code, 0)
    assert.equal(stderr(), 'doc > doc.foo: written\n')
    assert.equal(document, 'two')
  })

  await t.test('should write JSON when `treeOut` is given', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const result = await engine({
      cwd,
      extensions: ['txt'],
      files: ['.'],
      output: true,
      processor: noop().use(
        /** @type {Plugin<[], Literal>} */
        function () {
          return function (tree) {
            tree.value = 'two'
          }
        }
      ),
      streamError: stderr.stream,
      treeOut: true
    })

    const document = String(await fs.readFile(new URL('one.json', cwd)))

    await fs.unlink(new URL('one.json', cwd))

    assert.equal(result.code, 0)
    assert.equal(stderr(), 'one.txt > one.json: written\n')
    assert.equal(document, '{\n  "type": "text",\n  "value": "two"\n}\n')
  })

  await t.test('should support `treeOut` for stdin', async function () {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setImmediate(send)

    const result = await engine({
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream,
      treeOut: true
    })

    assert.equal(result.code, 0)
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

    const result = await engine({
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream,
      treeIn: true
    })

    assert.equal(result.code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '\n')

    function send() {
      stdin.end('{"type":"text","value":"\\n"}')
    }
  })

  await t.test('should write injected files', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    const result = await engine({
      cwd,
      files: [new VFile(new URL('one.txt', cwd))],
      output: 'bar.json',
      processor: noop,
      streamError: stderr.stream,
      treeOut: true
    })

    await fs.unlink(new URL('bar.json', cwd))

    assert.equal(result.code, 0)
    assert.equal(stderr(), 'one.txt > bar.json: written\n')
  })
})
