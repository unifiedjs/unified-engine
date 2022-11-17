/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('tree', async () => {
  await new Promise((resolve) => {
    const cwd = new URL('malformed-tree/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        treeIn: true,
        files: ['doc.json']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, 'doc.json\n  1:1  error  Error: Cannot read file as JSON'],
          'should fail on malformed input'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd,
        streamError: stderr.stream,
        output: true,
        tree: true,
        files: ['doc']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('doc.json', cwd), 'utf8')

        fs.unlinkSync(new URL('doc.json', cwd))

        assert.deepEqual(
          [error, code, doc, stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "two"\n}\n',
            'doc > doc.json: written\n'
          ],
          'should read and write JSON when `tree` is given'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd,
        streamError: stderr.stream,
        output: true,
        treeIn: true,
        files: ['doc'],
        extensions: ['foo']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('doc.foo', cwd), 'utf8')

        fs.unlinkSync(new URL('doc.foo', cwd))

        assert.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'doc > doc.foo: written\n'],
          'should read JSON when `treeIn` is given'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd,
        streamError: stderr.stream,
        output: true,
        treeOut: true,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('one.json', cwd), 'utf8')

        fs.unlinkSync(new URL('one.json', cwd))

        assert.deepEqual(
          [error, code, doc, stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "two"\n}\n',
            'one.txt > one.json: written\n'
          ],
          'should write JSON when `treeOut` is given'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setTimeout(send, 50)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeOut: true
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "\\n"\n}\n',
            '<stdin>: no issues found\n'
          ],
          'should support `treeOut` for stdin'
        )
        resolve(undefined)
      }
    )

    function send() {
      stdin.end('\n')
    }
  })

  await new Promise((resolve) => {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setTimeout(send, 50)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeIn: true
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '\n', '<stdin>: no issues found\n'],
          'should support `treeIn` for stdin'
        )
        resolve(undefined)
      }
    )

    function send() {
      stdin.end('{"type":"text","value":"\\n"}')
    }
  })

  await new Promise((resolve) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        output: 'bar.json',
        treeOut: true,
        files: [toVFile(new URL('one.txt', cwd))]
      },
      (error, code) => {
        fs.unlinkSync(new URL('bar.json', cwd))

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt > bar.json: written\n'],
          'should write injected files'
        )
        resolve(undefined)
      }
    )
  })
})
