import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {sep} from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('file-path', async function (t) {
  await t.test('should throw on `filePath` with files', async function () {
    try {
      await run({
        cwd: new URL('simple-structure/', fixtures),
        extensions: ['txt'],
        filePath: 'qux/quux.foo',
        files: ['.'],
        processor: noop
      })
      assert.fail()
    } catch (error) {
      assert.match(String(error), /Do not pass both `filePath` and real files/)
    }
  })

  await t.test('should support `filePath`', async function () {
    const cwd = new URL('empty/', fixtures)
    const stderr = spy()
    const stdout = spy()
    const stream = new PassThrough()
    let index = 0

    await fs.mkdir(cwd, {recursive: true})

    send()

    const code = await run({
      cwd,
      filePath: 'foo' + sep + 'bar.baz',
      processor: noop,
      streamError: stderr.stream,
      streamIn: stream,
      streamOut: stdout.stream
    })

    assert.equal(code, 0)
    assert.equal(stdout(), '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n')
    assert.equal(stderr(), 'foo' + sep + 'bar.baz: no issues found\n')

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })
})
