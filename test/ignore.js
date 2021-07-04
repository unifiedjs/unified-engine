import fs from 'fs'
import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('ignore', (t) => {
  t.plan(10)

  t.test('should fail fatally when given ignores are not found', (t) => {
    const cwd = path.join(fixtures, 'simple-structure')
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
        cwd: path.join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: false,
        ignorePath: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'three.txt: no issues found',
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
        cwd: path.join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'three.txt: no issues found',
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
        cwd: path.join(fixtures, 'hidden-directory'),
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
        cwd: path.join(fixtures, 'simple-structure'),
        streamError: stderr.stream,
        files: ['.'],
        detectIgnore: true,
        ignoreName: '.fooignore',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'three.txt: no issues found',
          'nested' + path.sep + 'two.txt: no issues found',
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
        cwd: path.join(fixtures, 'simple-structure'),
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
        cwd: path.join(fixtures, 'ignore-file'),
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
          cwd: path.join(fixtures, 'sibling-ignore'),
          streamError: stderr.stream,
          files: ['.'],
          ignorePath: path.join('deep', 'ignore'),
          ignorePatterns: ['files/two.txt'],
          extensions: ['txt']
        },
        (error, code) => {
          const expected = [
            path.join('deep', 'files', 'two.txt') + ': no issues found',
            path.join('files', 'one.txt') + ': no issues found',
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
        cwd: path.join(fixtures, 'sibling-ignore'),
        streamError: stderr.stream,
        files: ['.'],
        ignorePath: path.join('deep', 'ignore'),
        ignorePathResolveFrom: 'cwd',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          path.join('deep', 'files', 'one.txt') + ': no issues found',
          path.join('deep', 'files', 'two.txt') + ': no issues found',
          path.join('files', 'two.txt') + ': no issues found',
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
    const cwd = path.join(fixtures, 'empty')
    const filePath = path.resolve(process.cwd(), '../..', 'example.txt')
    const stderr = spy()

    fs.writeFileSync(filePath, '')

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: [filePath]
      },
      (error, code) => {
        fs.unlinkSync(filePath)

        const expected = path.relative(cwd, filePath) + ': no issues found\n'

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })
})
