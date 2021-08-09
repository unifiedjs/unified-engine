import path from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = path.join('test', 'fixtures')

test('stdin', (t) => {
  t.plan(3)

  t.test('should support stdin', (t) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    t.plan(1)

    send()

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'empty'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            '<stdin>: no issues found\n'
          ],
          'should report'
        )
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

  t.test('should not output if `out: false`', (t) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    t.plan(1)

    send()

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'empty'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        out: false
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [null, 0, '', '<stdin>: no issues found\n'],
          'should report'
        )
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

  t.test('should support config files on stdin', (t) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    t.plan(2)

    send()

    engine(
      {
        processor: noop().use(function () {
          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
        }),
        cwd: path.join(fixtures, 'config-settings'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        packageField: 'fooConfig',
        rcName: '.foorc'
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            '<stdin>: no issues found\n'
          ],
          'should work'
        )
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
