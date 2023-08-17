/**
 * @typedef {import('unist').Node} Node
 */

import assert from 'node:assert/strict'
import {join, sep} from 'node:path'
import {PassThrough} from 'node:stream'
import test from 'node:test'
import {promisify} from 'node:util'
import {unified} from 'unified'
import {VFile} from 'vfile'
import {engine} from '../index.js'
import {cleanError} from './util/clean-error.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('input', async function (t) {
  await t.test('should fail without input', async function () {
    const stream = new PassThrough()

    // Spoof stdin(4).
    // @ts-expect-error: not typed by types/node, but it exists and is handled.
    stream.isTTY = true

    setImmediate(function () {
      stream.end()
    })

    try {
      await run({processor: unified(), streamIn: stream})
      assert.fail()
    } catch (error) {
      assert.match(String(error), /No input/)
    }
  })

  await t.test('should not fail on empty input stream', async function () {
    const stderr = spy()
    const streamIn = new PassThrough()

    setImmediate(function () {
      streamIn.end('')
    })

    const code = await run({
      processor: noop,
      streamError: stderr.stream,
      streamIn
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '<stdin>: no issues found\n')
  })

  await t.test('should not fail on unmatched given globs', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('empty/', fixtures),
      files: ['.'],
      processor: unified(),
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), '')
  })

  await t.test('should report unfound given files', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('empty/', fixtures),
      files: ['readme.md'],
      processor: unified(),
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      cleanError(stderr()),
      [
        'readme.md',
        ' error No such file or directory',
        '  [cause]:',
        '    Error: ENOENT:…',
        '',
        '✖ 1 error',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should not report unfound given directories',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('directory/', fixtures),
        files: ['empty/'],
        processor: unified(),
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), '')
    }
  )

  await t.test('should search for extensions', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('extensions/', fixtures),
      extensions: ['txt', '.text'],
      files: ['.'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'bar.text: no issues found',
        'foo.txt: no issues found',
        'nested' + sep + 'quux.text: no issues found',
        'nested' + sep + 'qux.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test('should search a directory for extensions', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('extensions/', fixtures),
      extensions: ['txt', 'text'],
      files: ['nested'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'quux.text: no issues found',
        'nested' + sep + 'qux.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should search for globs matching files (#1)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('globs/', fixtures),
        extensions: [],
        files: ['*/*.+(txt|text)'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          'nested' + sep + 'no-3.txt: no issues found',
          'nested' + sep + 'no-4.text: no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test(
    'should search for globs matching files (#2)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('globs/', fixtures),
        extensions: [],
        files: ['*/*.txt', '*/*.text'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          'nested' + sep + 'no-3.txt: no issues found',
          'nested' + sep + 'no-4.text: no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test('should search for globs matching dirs', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('globs/', fixtures),
      extensions: [],
      files: ['**/nested'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'no-3.txt: no issues found',
        'nested' + sep + 'no-4.text: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should search vfile’s pointing to directories',
    async function () {
      const cwd = new URL('ignore-file/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        files: [new VFile(new URL('nested', cwd))],
        ignoreName: '.fooignore',
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'nested' + sep + 'three.txt: no issues found\n')
    }
  )

  await t.test(
    'should not ignore implicitly ignored files in globs',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('globs-ignore/', fixtures),
        extensions: [],
        files: ['**/*.txt'],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
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
      )
    }
  )

  await t.test('should include given ignored files (#1)', async function () {
    const cwd = new URL('ignore-file/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      files: [
        new VFile(new URL('one.txt', cwd)),
        new VFile(new URL('nested/two.txt', cwd)),
        new VFile(new URL('nested/three.txt', cwd))
      ],
      ignoreName: '.fooignore',
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'nested' + sep + 'two.txt',
        ' error Cannot process specified file: it’s ignored',
        '',
        'one.txt: no issues found',
        '',
        '✖ 1 error',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should not attempt to read files with `value` (1)',
    async function () {
      const cwd = new URL('ignore-file/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        files: [
          new VFile({
            path: new URL('not-existing.txt', cwd),
            value: 'foo'
          })
        ],
        ignoreName: '.fooignore',
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 1)
      assert.equal(
        stderr(),
        [
          'not-existing.txt',
          ' error Cannot process specified file: it’s ignored',
          '',
          '✖ 1 error',
          ''
        ].join('\n')
      )
    }
  )

  await t.test(
    'should not attempt to read files with `value` (2)',
    async function () {
      const stderr = spy()
      const cwd = new URL('ignore-file/', fixtures)

      const code = await run({
        cwd,
        ignoreName: '.fooignore',
        files: [
          new VFile({
            path: new URL('not-existing-2.txt', cwd),
            value: 'foo'
          })
        ],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'not-existing-2.txt: no issues found\n')
    }
  )

  await t.test(
    'should not attempt to read files with `value` (3)',
    async function () {
      const stderr = spy()
      const cwd = new URL('empty/', fixtures)

      const code = await run({
        cwd,
        files: [
          new VFile({
            path: new URL('not-existing-1.txt', cwd),
            value: 'foo'
          }),
          new VFile({
            path: new URL('not-existing-2.txt', cwd),
            value: 'bar'
          })
        ],
        processor: noop().use(
          /** @type {import('unified').Plugin<[], Node>} */
          function () {
            return function (_, file) {
              file.message('!')
            }
          }
        ),
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
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
      )
    }
  )

  await t.test(
    'should not attempt to read files with `value` (4)',
    async function () {
      const stderr = spy()
      const cwd = join('test', 'fixtures', 'empty')
      const file = new VFile({value: 'foo'})

      const code = await run({
        cwd,
        files: [file],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        'test' + sep + 'fixtures' + sep + 'empty: no issues found\n'
      )
    }
  )

  await t.test('should include given ignored files (#2)', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('ignore-file/', fixtures),
      ignoreName: '.fooignore',
      files: ['**/*.txt'],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 1)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'nested' + sep + 'two.txt',
        ' error Cannot process specified file: it’s ignored',
        '',
        'one.txt: no issues found',
        '',
        '✖ 1 error',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'silentlyIgnore: skip detected ignored files (#1)',
    async function () {
      const cwd = new URL('ignore-file/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        files: [
          new VFile(new URL('one.txt', cwd)),
          new VFile(new URL('nested/two.txt', cwd)),
          new VFile(new URL('nested/three.txt', cwd))
        ],
        ignoreName: '.fooignore',
        processor: noop,
        silentlyIgnore: true,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test(
    'silentlyIgnore: skip detected ignored files (#2)',
    async function () {
      const stderr = spy()

      const code = await run({
        cwd: new URL('ignore-file/', fixtures),
        files: ['**/*.txt'],
        ignoreName: '.fooignore',
        processor: noop,
        silentlyIgnore: true,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(
        stderr(),
        [
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')
      )
    }
  )

  await t.test(
    'should fail w/ `ignoreUnconfigured` and `rcPath`',
    async function () {
      try {
        await run({
          cwd: new URL('empty/', fixtures),
          files: ['.'],
          ignoreUnconfigured: true,
          processor: unified(),
          rcPath: '123',
          streamError: spy().stream
        })
        assert.fail()
      } catch (error) {
        assert.match(
          String(error),
          /Cannot accept both `rcPath` and `ignoreUnconfigured`/
        )
      }
    }
  )

  await t.test(
    'should fail w/ `ignoreUnconfigured` and w/o `rcName`, `packageField`',
    async function () {
      try {
        await run({
          cwd: new URL('empty/', fixtures),
          files: ['.'],
          ignoreUnconfigured: true,
          processor: unified(),
          streamError: spy().stream
        })
        assert.fail()
      } catch (error) {
        assert.match(
          String(error),
          /Missing `rcName` or `packageField` with `ignoreUnconfigured`/
        )
      }
    }
  )

  await t.test(
    'should fail w/ `ignoreUnconfigured` and `detectConfig: false`',
    async function () {
      try {
        await run({
          cwd: new URL('empty/', fixtures),
          detectConfig: false,
          files: ['.'],
          ignoreUnconfigured: true,
          packageField: 'y',
          processor: unified(),
          rcName: 'x',
          streamError: spy().stream
        })
        assert.fail()
      } catch (error) {
        assert.match(
          String(error),
          /Cannot use `detectConfig: false` with `ignoreUnconfigured`/
        )
      }
    }
  )

  await t.test('should report', async function () {
    const stderr = spy()

    const code = await run({
      cwd: new URL('config-ignore-unconfigured/', fixtures),
      files: ['.'],
      ignoreUnconfigured: true,
      processor: noop,
      rcName: '.foorc',
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(stderr(), 'folder' + sep + 'two.txt: no issues found\n')
  })

  await t.test('should search if given files', async function () {
    const cwd = new URL('simple-structure/', fixtures)
    const stderr = spy()

    const code = await run({
      cwd,
      extensions: ['txt'],
      files: ['nested', new VFile(new URL('one.txt', cwd))],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(code, 0)
    assert.equal(
      stderr(),
      [
        'nested' + sep + 'three.txt: no issues found',
        'nested' + sep + 'two.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')
    )
  })

  await t.test(
    'should not access the file system for empty given files',
    async function () {
      const cwd = new URL('empty/', fixtures)
      const stderr = spy()

      const code = await run({
        cwd,
        files: [
          new VFile({
            path: new URL('this-does-not-exist.txt', cwd),
            value: ''
          })
        ],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(code, 0)
      assert.equal(stderr(), 'this-does-not-exist.txt: no issues found\n')
    }
  )
})
