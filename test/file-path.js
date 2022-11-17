import assert from 'node:assert/strict'
import {sep} from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('file-path', async () => {
  await new Promise((resolve) => {
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

        assert.equal(actual, expected, 'should throw on `filePath` with files')
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stdout = spy()
    const stderr = spy()
    const stream = new PassThrough()
    let index = 0

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
        assert.deepEqual(
          [error, code, stdout(), stderr()],
          [
            null,
            0,
            '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
            'foo' + sep + 'bar.baz: no issues found\n'
          ],
          'should support `filePath`'
        )
        resolve(undefined)
      }
    )
  })
})
