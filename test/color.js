import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {engine} from 'unified-engine'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('color', async function (t) {
  await t.test('should support color', async function () {
    const cwd = new URL('empty/', fixtures)
    const stderr = spy()

    await fs.mkdir(cwd, {recursive: true})

    const result = await engine({
      color: true,
      cwd,
      files: ['readme.md'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(result.code, 1)
    assert.equal(
      cleanError(stderr()),
      [
        '\u001B[4m\u001B[31mreadme.md\u001B[39m\u001B[24m',
        ' \u001B[31merror\u001B[39m \u001B[1mNo such file or folder\u001B[22m',
        '  \u001B[1m[cause]\u001B[22m:',
        '    Error: ENOENT:…',
        '',
        '\u001B[31m✖\u001B[39m 1 error',
        ''
      ].join('\n')
    )
  })
})
