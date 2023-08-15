import assert from 'node:assert/strict'
import {sep, join} from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {unified} from 'unified'
import {toVFile} from 'to-vfile'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('input', async () => {
  await new Promise((resolve) => {
    const stream = new PassThrough()

    // Spoof stdin(4).
    // @ts-expect-error: fine.
    stream.isTTY = true

    engine({processor: unified(), streamIn: stream}, (error) => {
      assert.equal(
        error && error.message,
        'No input',
        'should fail without input'
      )
      resolve(undefined)
    })

    stream.end()
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const stream = new PassThrough()

    engine(
      {
        processor: noop,
        streamIn: stream,
        streamError: stderr.stream
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, '<stdin>: no issues found\n'],
          'should not fail on empty input stream'
        )
        resolve(undefined)
      }
    )

    stream.end('')
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: unified(),
        cwd: new URL('empty/', fixtures),
        streamError: stderr.stream,
        files: ['.']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, ''],
          'should not fail on unmatched given globs'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: unified(),
        cwd: new URL('empty/', fixtures),
        streamError: stderr.stream,
        files: ['readme.md']
      },
      (error, code) => {
        const expected = [
          'readme.md',
          ' error No such file or directory',
          '  [cause]:',
          '    Error: ENOENT:…',
          '',
          '✖ 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, cleanError(stderr())],
          [null, 1, expected],
          'should report unfound given files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()

    engine(
      {
        processor: unified(),
        cwd: new URL('directory/', fixtures),
        streamError: stderr.stream,
        files: ['empty/']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, ''],
          'should not report unfound given directories'
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
        cwd: new URL('extensions/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt', '.text']
      },
      (error, code) => {
        const expected = [
          'bar.text: no issues found',
          'foo.txt: no issues found',
          'nested' + sep + 'quux.text: no issues found',
          'nested' + sep + 'qux.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should search for extensions'
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
        cwd: new URL('extensions/', fixtures),
        streamError: stderr.stream,
        files: ['nested'],
        extensions: ['txt', 'text']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'quux.text: no issues found',
          'nested' + sep + 'qux.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should search a directory for extensions'
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
        cwd: new URL('globs/', fixtures),
        streamError: stderr.stream,
        files: ['*/*.+(txt|text)'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'no-3.txt: no issues found',
          'nested' + sep + 'no-4.text: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should search for globs matching files (#1)'
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
        cwd: new URL('globs/', fixtures),
        streamError: stderr.stream,
        files: ['*/*.txt', '*/*.text'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'no-3.txt: no issues found',
          'nested' + sep + 'no-4.text: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should search for globs matching files (#2)'
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
        cwd: new URL('globs/', fixtures),
        streamError: stderr.stream,
        files: ['**/nested'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'no-3.txt: no issues found',
          'nested' + sep + 'no-4.text: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should search for globs matching dirs'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('ignore-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [toVFile(new URL('nested', cwd))]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'nested' + sep + 'three.txt: no issues found\n'],
          'should search vfile’s pointing to directories'
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
        cwd: new URL('globs-ignore/', fixtures),
        streamError: stderr.stream,
        files: ['**/*.txt'],
        extensions: []
      },
      (error, code) => {
        const expected = [
          'nested' +
            sep +
            'node_modules' +
            sep +
            'ignore-two.txt: no issues found',
          'nested' + sep + 'two.txt: no issues found',
          'node_modules' + sep + 'ignore-one.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should not ignore implicitly ignored files in globs'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('ignore-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [
          toVFile(new URL('one.txt', cwd)),
          toVFile(new URL('nested/two.txt', cwd)),
          toVFile(new URL('nested/three.txt', cwd))
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'nested' + sep + 'two.txt',
          ' error Cannot process specified file: it’s ignored',
          '',
          'one.txt: no issues found',
          '',
          '✖ 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should include given ignored files (#1)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = new URL('ignore-file/', fixtures)
    const file = toVFile({
      path: new URL('not-existing.txt', cwd),
      value: 'foo'
    })

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
          ' error Cannot process specified file: it’s ignored',
          '',
          '✖ 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should not attempt to read files with `value` (1)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = new URL('ignore-file/', fixtures)
    const file = toVFile({
      path: new URL('not-existing-2.txt', cwd),
      value: 'foo'
    })

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [file]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'not-existing-2.txt: no issues found\n'],
          'should not attempt to read files with `value` (2)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = new URL('empty/', fixtures)
    const file1 = toVFile({
      path: new URL('not-existing-1.txt', cwd),
      value: 'foo'
    })
    const file2 = toVFile({
      path: new URL('not-existing-2.txt', cwd),
      value: 'bar'
    })

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
        assert.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            [
              'not-existing-1.txt',
              ' warning !',
              '',
              'not-existing-2.txt',
              ' warning !',
              '',
              '⚠ 2 warnings',
              ''
            ].join('\n')
          ],
          'should not attempt to read files with `value` (3)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const stderr = spy()
    const cwd = join('test', 'fixtures', 'empty')
    const file = toVFile({value: 'foo'})

    engine(
      {processor: noop, cwd, streamError: stderr.stream, files: [file]},
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [
            null,
            0,
            'test' + sep + 'fixtures' + sep + 'empty: no issues found\n'
          ],
          'should not attempt to read files with `value` (4)'
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
        ignoreName: '.fooignore',
        files: ['**/*.txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'nested' + sep + 'two.txt',
          ' error Cannot process specified file: it’s ignored',
          '',
          'one.txt: no issues found',
          '',
          '✖ 1 error',
          ''
        ].join('\n')

        assert.deepEqual(
          [error, code, stderr()],
          [null, 1, expected],
          'should include given ignored files (#2)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('ignore-file/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        silentlyIgnore: true,
        files: [
          toVFile(new URL('one.txt', cwd)),
          toVFile(new URL('nested/two.txt', cwd)),
          toVFile(new URL('nested/three.txt', cwd))
        ]
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
          'silentlyIgnore: skip detected ignored files (#1)'
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
        silentlyIgnore: true,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: ['**/*.txt']
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
          'silentlyIgnore: skip detected ignored files (#2)'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    engine(
      {
        processor: unified(),
        cwd: new URL('empty/', fixtures),
        streamError: spy().stream,
        files: ['.'],
        rcPath: '123',
        ignoreUnconfigured: true
      },
      (error) => {
        assert.match(
          String(error),
          /Cannot accept both `rcPath` and `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and `rcPath`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    engine(
      {
        processor: unified(),
        cwd: new URL('empty/', fixtures),
        streamError: spy().stream,
        files: ['.'],
        ignoreUnconfigured: true
      },
      (error) => {
        assert.match(
          String(error),
          /Missing `rcName` or `packageField` with `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and w/o `rcName`, `packageField`'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    engine(
      {
        processor: unified(),
        cwd: new URL('empty/', fixtures),
        streamError: spy().stream,
        files: ['.'],
        rcName: 'x',
        packageField: 'y',
        detectConfig: false,
        ignoreUnconfigured: true
      },
      (error) => {
        assert.match(
          String(error),
          /Cannot use `detectConfig: false` with `ignoreUnconfigured`/,
          'should fail w/ `ignoreUnconfigured` and `detectConfig: false`'
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
        cwd: new URL('config-ignore-unconfigured/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        ignoreUnconfigured: true
      },
      (error, code) => {
        const expected = ['folder' + sep + 'two.txt: no issues found', ''].join(
          '\n'
        )

        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        extensions: ['txt'],
        files: ['nested', toVFile(new URL('one.txt', cwd))]
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
          'should search if given files'
        )
        resolve(undefined)
      }
    )
  })

  await new Promise((resolve) => {
    const cwd = new URL('empty/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: [
          toVFile({
            path: new URL('this-does-not-exist.txt', cwd),
            value: ''
          })
        ]
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'this-does-not-exist.txt: no issues found\n'],
          'should not access the file system for empty given files'
        )
        resolve(undefined)
      }
    )
  })
})
