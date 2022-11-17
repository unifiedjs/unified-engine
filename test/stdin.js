import assert from 'node:assert/strict'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('stdin', async () => {
  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    send()

    engine(
      {
        processor: noop,
        cwd: new URL('empty/', fixtures),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            '<stdin>: no issues found\n'
          ],
          'should support stdin'
        )
        resolve(undefined)
      }
    )

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    send()

    engine(
      {
        processor: noop,
        cwd: new URL('empty/', fixtures),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        out: false
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', '<stdin>: no issues found\n'],
          'should not output if `out: false`'
        )
        resolve(undefined)
      }
    )

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    send()

    engine(
      {
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
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            '<stdin>: no issues found\n'
          ],
          'should support config files on stdin'
        )
        resolve(undefined)
      }
    )

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
