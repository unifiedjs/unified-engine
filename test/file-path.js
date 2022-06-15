import {sep} from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('file-path', (t) => {
  t.plan(2)

  t.test('should throw on `filePath` with files', (t) => {
    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('simple-structure/', fixtures),
        files: ['.'],
        filePath: 'qux/quux.foo',
        extensions: ['txt']
      },
      (error) => {
        const actual = error && error.message.split('\n').slice(0, 2).join('\n')

        const expected = [
          'Do not pass both `--file-path` and real files.',
          'Did you mean to pass stdin instead of files?'
        ].join('\n')

        t.equal(actual, expected, 'should fail')
      }
    )
  })

  t.test('should support `filePath`', (t) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

    t.plan(1)

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }

    send()

    engine(
      {
        processor: noop,
        cwd: new URL('empty/', fixtures),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        streamIn: stream,
        filePath: 'foo' + sep + 'bar.baz'
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            'foo' + sep + 'bar.baz: no issues found\n'
          ],
          'should report'
        )
      }
    )
  })
})
