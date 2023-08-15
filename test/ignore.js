import assert from 'node:assert/strict'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import {join, sep, relative} from 'node:path'
import test from 'node:test'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('ignore', async () => {
  await new Promise((resolve) => {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: ['one.txt'],
        detectIgnore: false,
        ignorePath: '.missing-ignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'one.txt',
          ' error Error: Cannot read given file `.missing-ignore`',
          'Error: ENOENT:…'
        ].join('\n')

        assert.deepEqual(
          [error, code, cleanError(stderr(), 3)],
          [null, 1, expected],
          'should fail fatally when given ignores are not found'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('ignore-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: false,
        ignorePath: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support custom ignore files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('ignore-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support searching ignore files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('hidden-directory/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        // No `ignoreName`.
        extensions: ['txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should not look into hidden files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('simple-structure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'nested' + sep + 'two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support no ignore files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('simple-structure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        ignorePatterns: ['**/t*.*'],
        extensions: ['txt']
      },
      (error, code) => {
        const expected = ['one.txt: no issues found', ''].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support ignore patterns'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('ignore-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        ignorePatterns: ['nested'],
        extensions: ['txt']
      },
      (error, code) => {
        const expected = ['one.txt: no issues found', ''].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support ignore files and ignore patterns'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('sibling-ignore/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        ignorePath: join('deep', 'ignore'),
        ignorePatterns: ['files/two.txt'],
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          join('deep', 'files', 'two.txt') + ': no issues found',
          join('files', 'one.txt') + ': no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          '`ignorePath` should resolve from its directory, `ignorePatterns` from cwd'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: new URL('sibling-ignore/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        ignorePath: join('deep', 'ignore'),
        ignorePathResolveFrom: 'cwd',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          join('deep', 'files', 'one.txt') + ': no issues found',
          join('deep', 'files', 'two.txt') + ': no issues found',
          join('files', 'two.txt') + ': no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          '`ignorePathResolveFrom`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('empty/', fixtures)
    const url = new URL('../../../example.txt', import.meta.url)
    const stderr = spy()

    fs.writeFileSync(url, '')

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: [url]
      },
      (error, code) => {
        fs.unlinkSync(url)

        const expected =
          relative(fileURLToPath(cwd), fileURLToPath(url)) +
          ': no issues found\n'

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should support higher positioned files'
        )
        resolve(undefined)
      }
    )
  })
})
