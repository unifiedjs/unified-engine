import fs from 'fs'
import path from 'path'
import test from 'tape'
import {toVFile} from 'to-vfile'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join(process.cwd(), 'test', 'fixtures')

test('output', (t) => {
  t.plan(16)

  t.test('should not write to stdout on dirs', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to stdout on one file', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, 'two', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write to stdout without `out`', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        streamOut: stdout.stream,
        out: false,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write multiple files to stdout', (t) => {
    const cwd = path.join(fixtures, 'two-files')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        cwd,
        out: false,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\ntwo.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should output files', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const doc = fs.readFileSync(path.join(cwd, 'one.txt'), 'utf8')

      fs.truncateSync(path.join(cwd, 'one.txt'))

      t.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, 'two', 'one.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to a path', (t) => {
    const cwd = path.join(fixtures, 'simple-structure')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        output: 'four.txt',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const input = fs.readFileSync(path.join(cwd, 'one.txt'), 'utf8')
      const output = fs.readFileSync(path.join(cwd, 'four.txt'), 'utf8')

      fs.unlinkSync(path.join(cwd, 'four.txt'))

      t.deepEqual(
        [error, code, input, output, stderr()],
        [null, 0, '', 'two', 'one.txt > four.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to directories', (t) => {
    const cwd = path.join(fixtures, 'simple-structure')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        output: 'nested/',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const input = fs.readFileSync(path.join(cwd, 'one.txt'), 'utf8')
      const output = fs.readFileSync(
        path.join(cwd, 'nested', 'one.txt'),
        'utf8'
      )

      fs.unlinkSync(path.join(cwd, 'nested', 'one.txt'))

      t.deepEqual(
        [error, code, input, output, stderr()],
        [
          null,
          0,
          '',
          'two',
          'one.txt > nested' + path.sep + 'one.txt: written\n'
        ],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not create intermediate directories', (t) => {
    const cwd = path.join(fixtures, 'simple-structure')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd,
        streamError: stderr.stream,
        output: 'missing/bar',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const actual = stderr().split('\n').slice(0, 3).join('\n')

      const expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read parent directory. Error:',
        "ENOENT: no such file or directory, stat '" +
          path.join(cwd, 'missing') +
          "'"
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should write injected files', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: [toVFile(path.join(cwd, 'one.txt'))]
      },
      onrun
    )

    function onrun(error, code) {
      const doc = fs.readFileSync(path.join(cwd, 'one.txt'), 'utf8')

      fs.truncateSync(path.join(cwd, 'one.txt'))

      t.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, 'two', 'one.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write without file-path', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const doc = fs.readFileSync(path.join(cwd, 'one.txt'), 'utf8')

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

    function change() {
      return transformer
    }

    function transformer(tree, file) {
      tree.value = 'two'
      file.history = []
    }
  })

  t.test('should fail when writing files to one path', (t) => {
    const cwd = path.join(fixtures, 'two-files')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        output: 'three.txt',
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      let actual = stderr().split('\n').slice(0, 2)

      actual[1] = actual[1].split(':').slice(0, 3).join(':')

      actual = actual.join('\n')

      const expected = [
        'one.txt',
        '  1:1  error  Error: Cannot write multiple files to single output'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should fail when writing to non-existent dirs', (t) => {
    const cwd = path.join(fixtures, 'two-files')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        output: 'three' + path.sep,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const actual = stderr().split('\n').slice(0, 2).join('\n')

      const expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read output directory. Error:'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should not create a new file when input file does not exist', (t) => {
    const cwd = path.join(fixtures, 'empty')
    const targetFile = path.join(cwd, 'one.txt')
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop(),
        cwd,
        streamError: stderr.stream,
        output: true,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const actual = stderr().split('\n').slice(0, 2).join('\n')

      const expected = [
        'one.txt',
        '  1:1  error  No such file or directory'
      ].join('\n')

      t.deepEqual([error, code, actual], [null, 1, expected], 'should report')

      t.notOk(fs.existsSync(targetFile))
    }
  })

  t.test('should write buffers', (t) => {
    const cwd = path.join(fixtures, 'filled-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(buffer),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, 'bravo', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function buffer() {
      this.Compiler = compile
    }

    function compile() {
      return Buffer.from('bravo')
    }
  })

  t.test('should ignore nullish compilers', (t) => {
    const cwd = path.join(fixtures, 'filled-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(nullish),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout().trim(), stderr()],
        [null, 0, 'alpha', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function nullish() {
      this.Compiler = compile
    }

    function compile() {
      return null
    }
  })

  t.test('should ignore non-text compilers', (t) => {
    const cwd = path.join(fixtures, 'filled-file')
    const stdout = spy()
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop().use(vdom),
        cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stdout().trim(), stderr()],
        [null, 0, 'alpha', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function vdom() {
      this.Compiler = compile
    }

    function compile() {
      return {type: 'some-virtual-dom'}
    }
  })
})
