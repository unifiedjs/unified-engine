import assert from 'node:assert/strict'
import process from 'node:process'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const cross = process.platform === 'win32' ? '×' : '✖'

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
        const expected = [
          '\u001B[4m\u001B[31mreadme.md\u001B[39m\u001B[24m',
          '  1:1  \u001B[31merror\u001B[39m  No such file or directory',
          '',
          '\u001B[31m' + cross + '\u001B[39m 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should support color'
        )
        resolve(undefined)
      }
    )
  })
})
