import assert from 'node:assert/strict'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('stdin', async function (t) {
  await t.test('should support stdin', async function () {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    setImmediate(send)

    const code = await run({
      processor: noop,
      cwd: new URL('empty/', fixtures),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n')

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  await t.test('should not output if `out: false`', async function () {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    setImmediate(send)

    const code = await run({
      processor: noop,
      cwd: new URL('empty/', fixtures),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      out: false
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '')

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  await t.test('should support config files on stdin', async function () {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    setImmediate(send)

    const code = await run({
      processor: noop().use(function () {
        assert.deepEqual(
          this.data('settings'),
          {alpha: true},
          'should configure'
        )
      }),
      cwd: new URL('config-settings/', fixtures),
      streamIn: stream,
      streamOut: stdout.stream,
      streamError: stderr.stream,
      packageField: 'fooConfig',
      rcName: '.foorc'
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
    assert.equal(stdout(), '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n')

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
