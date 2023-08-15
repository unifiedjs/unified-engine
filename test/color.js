import assert from 'node:assert/strict'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {cleanError} from './util/clean-error.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('color', async () => {
  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('empty/', fixtures),
        streamError: stderr.stream,
        files: ['readme.md'],
        color: true
      },
      (error, code) => {
        const actual = cleanError(stderr())
        const expected = [
          '\u001B[4m\u001B[31mreadme.md\u001B[39m\u001B[24m',
          ' \u001B[31merror\u001B[39m \u001B[1mNo such file or directory\u001B[22m',
          '  \u001B[1m[cause]\u001B[22m:',
          '    Error: ENOENT:…',
          '',
          '\u001B[31m✖\u001B[39m 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should support color'
        )
        resolve(undefined)
      }
    )
  })
})
