import path from 'node:path'
import process from 'node:process'
import {PassThrough} from 'node:stream'
import test from 'tape'
import {unified} from 'unified'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const windows = process.platform === 'win32'
const cross = windows ? '×' : '✖'
const danger = windows ? '‼' : '⚠'

const fixtures = path.join('test', 'fixtures')

test('input', (t) => {
  t.plan(23)

  t.test('should fail without input', (t) => {
    const stream = new PassThrough()

    t.plan(1)

    // Spoof stdin(4).
    // @ts-expect-error: fine.
    stream.isTTY = true

    engine({processor: unified(), streamIn: stream}, (error) => {
      t.equal(error && error.message, 'No input', 'should fail')
    })

    stream.end()
  })

  t.test('should not fail on empty input stream', (t) => {
    const stderr = spy()
    const stream = new PassThrough()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stream,
        streamError: stderr.stream
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, '<stdin>: no issues found\n'],
          'should report'
        )
      }
    )

    stream.end('')
  })

  t.test('should not fail on unmatched given globs', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'empty'),
        streamError: stderr.stream,
        files: ['.']
      },
      (error, code) => {
        t.deepEqual([error, code, stderr()], [null, 0, ''], 'should work')
      }
    )
  })

  t.test('should report unfound given files', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'empty'),
        streamError: stderr.stream,
        files: ['readme.md']
      },
      (error, code) => {
        const expected = [
          'readme.md',
          '  1:1  error  No such file or directory',
          '',
          cross + ' 1 error',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should report'
        )
      }
    )
  })

  t.test('should not report unfound given directories', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'directory'),
        streamError: stderr.stream,
        files: ['empty/']
      },
      (error, code) => {
        t.deepEqual([error, code, stderr()], [null, 0, ''])
      }
    )
  })

  t.test('should search for extensions', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'extensions'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt', '.text']
      },
      (error, code) => {
        const expected = [
          'bar.text: no issues found',
          'foo.txt: no issues found',
          'nested' + path.sep + 'quux.text: no issues found',
          'nested' + path.sep + 'qux.txt: no issues found',
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

  t.test('should search a directory for extensions', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'extensions'),
        streamError: stderr.stream,
        files: ['nested'],
        extensions: ['txt', 'text']
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'quux.text: no issues found',
          'nested' + path.sep + 'qux.txt: no issues found',
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

  t.test('should search for globs matching files (#1)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['*/*.+(txt|text)'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'no-3.txt: no issues found',
          'nested' + path.sep + 'no-4.text: no issues found',
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

  t.test('should search for globs matching files (#2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['*/*.txt', '*/*.text'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'no-3.txt: no issues found',
          'nested' + path.sep + 'no-4.text: no issues found',
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

  t.test('should search for globs matching dirs', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['**/nested'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'no-3.txt: no issues found',
          'nested' + path.sep + 'no-4.text: no issues found',
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

  t.test('should search vfile’s pointing to directories', (t) => {
    const cwd = path.join(fixtures, 'ignore-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [toVFile(path.join(cwd, 'nested'))]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'nested' + path.sep + 'three.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not ignore implicitly ignored files in globs', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'globs-ignore'),
        streamError: stderr.stream,
        files: ['**/*.txt'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' +
            path.sep +
            'node_modules' +
            path.sep +
            'ignore-two.txt: no issues found',
          'nested' + path.sep + 'two.txt: no issues found',
          'node_modules' + path.sep + 'ignore-one.txt: no issues found',
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

  t.test('should include given ignored files (#1)', (t) => {
    const cwd = path.join(fixtures, 'ignore-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [
          toVFile(path.join(cwd, 'one.txt')),
          toVFile(path.join(cwd, 'nested', 'two.txt')),
          toVFile(path.join(cwd, 'nested', 'three.txt'))
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'three.txt: no issues found',
          'nested' + path.sep + 'two.txt',
          '  1:1  error  Cannot process specified file: it’s ignored',
          '',
          'one.txt: no issues found',
          '',
          cross + ' 1 error',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should report'
        )
      }
    )
  })

  t.test('should not attempt to read files with `value` (1)', (t) => {
    const stderr = spy()
    const cwd = path.join(fixtures, 'ignore-file')
    const file = toVFile({
      path: path.join(cwd, 'not-existing.txt'),
      value: 'foo'
    })

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [file]
      },
      (error, code) => {
        const expected = [
          'not-existing.txt',
          '  1:1  error  Cannot process specified file: it’s ignored',
          '',
          cross + ' 1 error',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should report'
        )
      }
    )
  })

  t.test('should not attempt to read files with `value` (2)', (t) => {
    const stderr = spy()
    const cwd = path.join(fixtures, 'ignore-file')
    const file = toVFile({
      path: path.join(cwd, 'not-existing-2.txt'),
      value: 'foo'
    })

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [file]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'not-existing-2.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should not attempt to read files with `value` (3)', (t) => {
    const stderr = spy()
    const cwd = path.join(fixtures, 'empty')
    const file1 = toVFile({
      path: path.join(cwd, 'not-existing-1.txt'),
      value: 'foo'
    })
    const file2 = toVFile({
      path: path.join(cwd, 'not-existing-2.txt'),
      value: 'bar'
    })

    t.plan(1)

    engine(
      {
        processor: noop().use(
          /** @type {import('unified').Plugin<Array<void>, import('unist').Node>} */
          function () {
            return (_, file) => {
              file.message('!')
            }
          }
        ),
        cwd,
        streamError: stderr.stream,
        files: [file1, file2]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            'not-existing-1.txt\n  1:1  warning  !\n\nnot-existing-2.txt\n  1:1  warning  !\n\n' +
              danger +
              ' 2 warnings\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should not attempt to read files with `value` (4)', (t) => {
    const stderr = spy()
    const cwd = path.join(fixtures, 'empty')
    const file = toVFile({value: 'foo'})

    t.plan(1)

    engine(
      {processor: noop, cwd, streamError: stderr.stream, files: [file]},
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            'test' +
              path.sep +
              'fixtures' +
              path.sep +
              'empty: no issues found\n'
          ],
          'should report'
        )
      }
    )
  })

  t.test('should include given ignored files (#2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: ['**/*.txt']
      },
      (error, code) => {
        const expected = [
          'nested' + path.sep + 'three.txt: no issues found',
          'nested' + path.sep + 'two.txt',
          '  1:1  error  Cannot process specified file: it’s ignored',
          '',
          'one.txt: no issues found',
          '',
          cross + ' 1 error',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should report'
        )
      }
    )
  })

  t.test('silentlyIgnore: skip detected ignored files (#1)', (t) => {
    const cwd = path.join(fixtures, 'ignore-file')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        silentlyIgnore: true,
        files: [
          toVFile(path.join(cwd, 'one.txt')),
          toVFile(path.join(cwd, 'nested', 'two.txt')),
          toVFile(path.join(cwd, 'nested', 'three.txt'))
        ]
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

  t.test('silentlyIgnore: skip detected ignored files (#2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'ignore-file'),
        silentlyIgnore: true,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: ['**/*.txt']
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

  t.test('ignoreUnconfigured', (t) => {
    t.plan(4)

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'empty'),
        streamError: spy().stream,
        files: ['.'],
        rcPath: '123',
        ignoreUnconfigured: true
      },
      (error) => {
        t.match(
          String(error),
          /Cannot accept both `rcPath` and `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and `rcPath`'
        )
      }
    )

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'empty'),
        streamError: spy().stream,
        files: ['.'],
        ignoreUnconfigured: true
      },
      (error) => {
        t.match(
          String(error),
          /Missing `rcName` or `packageField` with `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and w/o `rcName`, `packageField`'
        )
      }
    )

    engine(
      {
        processor: unified(),
        cwd: path.join(fixtures, 'empty'),
        streamError: spy().stream,
        files: ['.'],
        rcName: 'x',
        packageField: 'y',
        detectConfig: false,
        ignoreUnconfigured: true
      },
      (error) => {
        t.match(
          String(error),
          /Cannot use `detectConfig: false` with `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and `detectConfig: false`'
        )
      }
    )

    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'config-ignore-unconfigured'),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        ignoreUnconfigured: true
      },
      (error, code) => {
        const expected = [
          'folder' + path.sep + 'two.txt: no issues found',
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

  t.test('should search if given files', (t) => {
    const cwd = path.join(fixtures, 'simple-structure')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        extensions: ['txt'],
        files: ['nested', toVFile(path.join(cwd, 'one.txt'))]
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

  t.test('should not access the file system for empty given files', (t) => {
    const cwd = path.join(fixtures, 'empty')
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: [
          toVFile({
            path: path.join(cwd, 'this-does-not-exist.txt'),
            value: ''
          })
        ]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'this-does-not-exist.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })
})
