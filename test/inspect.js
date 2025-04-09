import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {engine} from 'unified-engine'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('inspect', async function (t) {
  await t.test('should write text when `inspect` is given', async function () {
    const cwd = new URL('one-file/', fixtures)
    const stderr = spy()
    const url = new URL('formatted.txt', cwd)

    const result = await engine({
      cwd,
      extensions: ['txt'],
      files: ['.'],
      inspect: true,
      output: 'formatted.txt',
      processor: noop(),
      streamError: stderr.stream
    })

    const document = String(await fs.readFile(url))
    await fs.unlink(url)

    assert.equal(result.code, 0)
    assert.equal(stderr(), 'one.txt > formatted.txt: written\n')
    assert.equal(document, 'text ""\n')
  })

  await t.test('should support `inspect` for stdin', async function () {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setImmediate(send)

    const result = await engine({
      inspect: true,
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream
    })

    assert.equal(result.code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), 'text "\\n"\n')

    function send() {
      stdin.end('\n')
    }
  })

  await t.test('should support `inspect` with color', async function () {
    const stdin = new PassThrough()
    const stdout = spy()
    const stderr = spy()

    setImmediate(send)

    const result = await engine({
      color: true,
      inspect: true,
      processor: noop,
      streamError: stderr.stream,
      streamIn: stdin,
      streamOut: stdout.stream
    })

    assert.equal(result.code, 0)
    assert.equal(
      stderr(),
      '\u001B[4m\u001B[32m<stdin>\u001B[39m\u001B[24m: no issues found\n'
    )
    assert.equal(
      stdout(),
      '\u001B[1mtext\u001B[22m \u001B[32m"\\n"\u001B[39m\n'
    )

    function send() {
      stdin.end('\n')
    }
  })
})
