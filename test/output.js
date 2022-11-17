/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import {sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import test from 'node:test'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('output', async () => {
  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd: new URL('one-file/', fixtures),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\n'],
          'should not write to stdout on dirs'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        cwd: new URL('one-file/', fixtures),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, 'two', 'one.txt: no issues found\n'],
          'should write to stdout on one file'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('one-file/', fixtures)
    const stdout = spy()
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
        streamOut: stdout.stream,
        out: false,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\n'],
          'should not write to stdout without `out`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('two-files/', fixtures)
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree) => {
            tree.value = 'two'
          }
        ),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        cwd,
        out: false,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\ntwo.txt: no issues found\n'],
          'should not write multiple files to stdout'
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
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const url = new URL('one.txt', cwd)
        const doc = fs.readFileSync(url, 'utf8')

        fs.truncateSync(url)

        assert.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'one.txt: written\n'],
          'should output files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('simple-structure/', fixtures)
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
        output: 'four.txt',
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const input = fs.readFileSync(new URL('one.txt', cwd), 'utf8')
        const output = fs.readFileSync(new URL('four.txt', cwd), 'utf8')

        fs.unlinkSync(new URL('four.txt', cwd))

        assert.deepEqual(
          [error, code, input, output, stderr()],
          [null, 0, '', 'two', 'one.txt > four.txt: written\n'],
          'should write to a path'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('simple-structure/', fixtures)
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
        output: 'nested/',
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const input = fs.readFileSync(new URL('one.txt', cwd), 'utf8')
        const output = fs.readFileSync(new URL('nested/one.txt', cwd), 'utf8')

        fs.unlinkSync(new URL('nested/one.txt', cwd))

        assert.deepEqual(
          [error, code, input, output, stderr()],
          [null, 0, '', 'two', 'one.txt > nested' + sep + 'one.txt: written\n'],
          'should write to directories'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop(),
        cwd,
        streamError: stderr.stream,
        output: 'missing/bar',
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 3).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot read parent directory. Error:',
          "ENOENT: no such file or directory, stat '" +
            fileURLToPath(new URL('missing', cwd)) +
            "'"
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should not create intermediate directories'
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
        files: [toVFile(new URL('one.txt', cwd))]
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('one.txt', cwd), 'utf8')

        fs.truncateSync(new URL('one.txt', cwd))

        assert.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'one.txt: written\n'],
          'should write injected files'
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
          () => (tree, file) => {
            tree.value = 'two'
            file.history = []
          }
        ),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('one.txt', cwd), 'utf8')

        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          '<stdin>',
          '  1:1  error  Error: Cannot write file without an output path'
        ].join('\n')

        assert.deepEqual(
          [error, code, doc, actual],
          [null, 1, '', expected],
          'should not write without file-path'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('two-files/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        output: 'three.txt',
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const lines = stderr().split('\n').slice(0, 2)
        lines[1] = lines[1].split(':').slice(0, 3).join(':')
        const actual = lines.join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot write multiple files to single output'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail when writing files to one path'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('two-files/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        output: 'three' + sep,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot read output directory. Error:'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail when writing to non-existent dirs'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('empty/', fixtures)
    const targetFile = new URL('one.txt', cwd)
    const stderr = spy()

    engine(
      {
        processor: noop(),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  No such file or directory'
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should not create a new file when input file does not exist'
        )

        assert.ok(!fs.existsSync(targetFile))
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal, Buffer>} */
          function () {
            Object.assign(this, {
              Compiler() {
                return Buffer.from('bravo')
              }
            })
          }
        ),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, 'bravo', 'one.txt: no issues found\n'],
          'should write buffers'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal, null>} */
          function () {
            Object.assign(this, {
              Compiler() {
                return null
              }
            })
          }
        ),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout().trim(), stderr()],
          [null, 0, 'alpha', 'one.txt: no issues found\n'],
          'should ignore nullish compilers'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, {kind: string}>} */
          function () {
            Object.assign(this, {
              Compiler() {
                return {kind: 'some-virtual-dom'}
              }
            })
          }
        ),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout().trim(), stderr()],
          [null, 0, 'alpha', 'one.txt: no issues found\n'],
          'should ignore non-text compilers'
        )
        resolve(undefined)
      }
    )
  })
})
