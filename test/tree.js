/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import {PassThrough} from 'node:stream'
import test from 'tape'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('tree', (t) => {
  t.plan(7)

  t.test('should fail on malformed input', (t) => {
    const cwd = new URL('malformed-tree/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: fileURLToPath(cwd),
        streamError: stderr.stream,
        treeIn: true,
        files: ['doc.json']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        t.deepEqual(
          [error, code, actual],
          [null, 1, 'doc.json\n  1:1  error  Error: Cannot read file as JSON'],
          'should report'
        )
      }
    )
  })

  t.test('should read and write JSON when `tree` is given', (t) => {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd: fileURLToPath(cwd),
        streamError: stderr.stream,
        output: true,
        tree: true,
        files: ['doc']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('doc.json', cwd), 'utf8')

        fs.unlinkSync(new URL('doc.json', cwd))

        t.deepEqual(
          [error, code, doc, stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "two"\n}\n',
            'doc > doc.json: written\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should read JSON when `treeIn` is given', (t) => {
    const cwd = new URL('tree/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd: fileURLToPath(cwd),
        streamError: stderr.stream,
        output: true,
        treeIn: true,
        files: ['doc'],
        extensions: ['foo']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('doc.foo', cwd), 'utf8')

        fs.unlinkSync(new URL('doc.foo', cwd))

        t.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'doc > doc.foo: written\n'],
          'should report'
        )
      }
    )
  })

  t.test('should write JSON when `treeOut` is given', (t) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd: fileURLToPath(cwd),
        streamError: stderr.stream,
        output: true,
        treeOut: true,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('one.json', cwd), 'utf8')

        fs.unlinkSync(new URL('one.json', cwd))

        t.deepEqual(
          [error, code, doc, stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "two"\n}\n',
            'one.txt > one.json: written\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should support `treeOut` for stdin', (t) => {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setTimeout(send, 50)

    t.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeOut: true
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '{\n  "type": "text",\n  "value": "\\n"\n}\n',
            '<stdin>: no issues found\n'
          ],
          'should work'
        )
      }
    )

    function send() {
      stdin.end('\n')
    }
  })

  t.test('should support `treeIn` for stdin', (t) => {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setTimeout(send, 50)

    t.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeIn: true
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '\n', '<stdin>: no issues found\n'],
          'should work'
        )
      }
    )

    function send() {
      stdin.end('{"type":"text","value":"\\n"}')
    }
  })

  t.test('should write injected files', (t) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: fileURLToPath(cwd),
        streamError: stderr.stream,
        output: 'bar.json',
        treeOut: true,
        files: [toVFile(new URL('one.txt', cwd))]
      },
      (error, code) => {
        fs.unlinkSync(new URL('bar.json', cwd))

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt > bar.json: written\n'],
          'should work'
        )
      }
    )
  })
})
