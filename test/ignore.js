import fs from 'node:fs'
import {fileURLToPath} from 'node:url'
import {join, sep, relative} from 'node:path'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('ignore', (t) => {
  t.plan(10)

  t.test('should fail fatally when given ignores are not found', (t) => {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    t.plan(1)

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
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot read given file `.missing-ignore`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should support custom ignore files', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support searching ignore files', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should not look into hidden files', (t) => {
    const stderr = spy()

    t.plan(1)

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
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should support no ignore files', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support ignore patterns', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support ignore files and ignore patterns', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test(
    '`ignorePath` should resolve from its directory, `ignorePatterns` from cwd',
    (t) => {
      const stderr = spy()

      t.plan(1)

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

          t.deepEqual(
            [error, code, stderr()],
            [null, 0, expected],
            'should report'
          )
        }
      )
    }
  )

  t.test('`ignorePathResolveFrom`', (t) => {
    const stderr = spy()

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support higher positioned files', (t) => {
    const cwd = new URL('empty/', fixtures)
    const url = new URL('../../../example.txt', import.meta.url)
    const stderr = spy()

    fs.writeFileSync(url, '')

    t.plan(1)

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

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })
})
