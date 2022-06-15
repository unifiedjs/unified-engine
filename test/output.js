/**
 * @typedef {import('unist').Literal<string>} Literal
 */

import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import {sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import test from 'tape'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('output', (t) => {
  t.plan(16)

  t.test('should not write to stdout on dirs', (t) => {
    const stdout = spy()
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
        cwd: fileURLToPath(new URL('one-file/', fixtures)),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should write to stdout on one file', (t) => {
    const stdout = spy()
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
        cwd: fileURLToPath(new URL('one-file/', fixtures)),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, 'two', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not write to stdout without `out`', (t) => {
    const cwd = new URL('one-file/', fixtures)
    const stdout = spy()
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
        streamOut: stdout.stream,
        out: false,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not write multiple files to stdout', (t) => {
    const cwd = new URL('two-files/', fixtures)
    const stdout = spy()
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
        streamOut: stdout.stream,
        streamError: stderr.stream,
        cwd: fileURLToPath(cwd),
        out: false,
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', 'one.txt: no issues found\ntwo.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should output files', (t) => {
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
        files: ['.'],
        extensions: ['txt']
      },
      (error, code) => {
        const url = new URL('one.txt', cwd)
        const doc = fs.readFileSync(url, 'utf8')

        fs.truncateSync(url)

        t.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'one.txt: written\n'],
          'should report'
        )
      }
    )
  })

  t.test('should write to a path', (t) => {
    const cwd = new URL('simple-structure/', fixtures)
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
        output: 'four.txt',
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const input = fs.readFileSync(new URL('one.txt', cwd), 'utf8')
        const output = fs.readFileSync(new URL('four.txt', cwd), 'utf8')

        fs.unlinkSync(new URL('four.txt', cwd))

        t.deepEqual(
          [error, code, input, output, stderr()],
          [null, 0, '', 'two', 'one.txt > four.txt: written\n'],
          'should report'
        )
      }
    )
  })

  t.test('should write to directories', (t) => {
    const cwd = new URL('simple-structure/', fixtures)
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
        output: 'nested/',
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const input = fs.readFileSync(new URL('one.txt', cwd), 'utf8')
        const output = fs.readFileSync(new URL('nested/one.txt', cwd), 'utf8')

        fs.unlinkSync(new URL('nested/one.txt', cwd))

        t.deepEqual(
          [error, code, input, output, stderr()],
          [null, 0, '', 'two', 'one.txt > nested' + sep + 'one.txt: written\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not create intermediate directories', (t) => {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: fileURLToPath(cwd),
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

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
      }
    )
  })

  t.test('should write injected files', (t) => {
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
        files: [toVFile(new URL('one.txt', cwd))]
      },
      (error, code) => {
        const doc = fs.readFileSync(new URL('one.txt', cwd), 'utf8')

        fs.truncateSync(new URL('one.txt', cwd))

        t.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, 'two', 'one.txt: written\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not write without file-path', (t) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, Literal>} */
          () => (tree, file) => {
            tree.value = 'two'
            file.history = []
          }
        ),
        cwd: fileURLToPath(cwd),
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

        t.deepEqual(
          [error, code, doc, actual],
          [null, 1, '', expected],
          'should report'
        )
      }
    )
  })

  t.test('should fail when writing files to one path', (t) => {
    const cwd = new URL('two-files/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: fileURLToPath(cwd),
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

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
      }
    )
  })

  t.test('should fail when writing to non-existent dirs', (t) => {
    const cwd = new URL('two-files/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: fileURLToPath(cwd),
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

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
      }
    )
  })

  t.test('should not create a new file when input file does not exist', (t) => {
    const cwd = new URL('empty/', fixtures)
    const targetFile = new URL('one.txt', cwd)
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop(),
        cwd: fileURLToPath(cwd),
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

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')

        t.notOk(fs.existsSync(targetFile))
      }
    )
  })

  t.test('should write buffers', (t) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

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
        cwd: fileURLToPath(cwd),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, 'bravo', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should ignore nullish compilers', (t) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

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
        cwd: fileURLToPath(cwd),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout().trim(), stderr()],
          [null, 0, 'alpha', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should ignore non-text compilers', (t) => {
    const cwd = new URL('filled-file/', fixtures)
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

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
        cwd: fileURLToPath(cwd),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout().trim(), stderr()],
          [null, 0, 'alpha', 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })
})
