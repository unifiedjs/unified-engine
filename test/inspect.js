import fs from 'fs'
import path from 'path'
import {PassThrough} from 'stream'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('inspect', (t) => {
  t.plan(3)

  t.test('should write text when `inspect` is given', (t) => {
    const cwd = path.join(fixtures, 'one-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd,
        streamError: stderr.stream,
        output: 'formatted.txt',
        inspect: true,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      const doc = fs.readFileSync(path.join(cwd, 'formatted.txt'), 'utf8')

      // Remove the file.
      fs.unlinkSync(path.join(cwd, 'formatted.txt'))

      t.deepEqual(
        [error, code, stderr(), doc],
        [null, 0, 'one.txt > formatted.txt: written\n', 'text ""\n'],
        'should work'
      )
    }
  })

  t.test('should support `inspect` for stdin', (t) => {
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
        inspect: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr(), stdout()],
        [null, 0, '<stdin>: no issues found\n', 'text "\\n"\n'],
        'should work'
      )
    }

    function send() {
      stdin.end('\n')
    }
  })

  t.test('should support `inspect` with color', (t) => {
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
        inspect: true,
        color: true
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr(), stdout()],
        [
          null,
          0,
          '\u001B[4m\u001B[32m<stdin>\u001B[39m\u001B[24m: no issues found\n',
          '\u001B[1mtext\u001B[22m \u001B[32m"\\n"\u001B[39m\n'
        ],
        'should work'
      )
    }

    function send() {
      stdin.end('\n')
    }
  })
})
