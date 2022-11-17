import assert from 'node:assert/strict'
import fs from 'node:fs'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('inspect', async () => {
  await new Promise((resolve) => {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()

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
      (error, code) => {
        const url = new URL('formatted.txt', cwd)
        const doc = fs.readFileSync(url, 'utf8')

        // Remove the file.
        fs.unlinkSync(url)

        assert.deepEqual(
          [error, code, stderr(), doc],
          [null, 0, 'one.txt > formatted.txt: written\n', 'text ""\n'],
          'should write text when `inspect` is given'
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
        inspect: true
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr(), stdout()],
          [null, 0, '<stdin>: no issues found\n', 'text "\\n"\n'],
          'should support `inspect` for stdin'
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
        inspect: true,
        color: true
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr(), stdout()],
          [
            null,
            0,
            '\u001B[4m\u001B[32m<stdin>\u001B[39m\u001B[24m: no issues found\n',
            '\u001B[1mtext\u001B[22m \u001B[32m"\\n"\u001B[39m\n'
          ],
          'should support `inspect` with color'
        )
        resolve(undefined)
      }
    )

    function send() {
      stdin.end('\n')
    }
  })
})
