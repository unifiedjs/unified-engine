/**
 * @import {FileSet} from 'unified-engine'
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import {engine} from 'unified-engine'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('completers', async function (t) {
  await t.test('should pass `fileSet` to plugins', async function () {
    const stderr = spy()
    let calls = 0
    let otherCalls = 0

    const result = await engine({
      cwd: new URL('two-files/', fixtures),
      files: ['one.txt'],
      plugins: [
        function (_, fileSet) {
          const set = /** @type {FileSet} */ (fileSet)
          assert.equal(typeof set, 'object', 'should pass a set')
          assert.equal(typeof set.use, 'function', 'should have a `use` method')
          assert.equal(
            typeof set.add,
            'function',
            'should have an `add` method'
          )

          // The completer is added multiple times, but it’s detected that its the
          // same function so it runs once.
          assert.equal(
            set.use(completer),
            set,
            'should be able to `use` a completer'
          )

          // Most often, completers cannot be detected to be the same because
          // they are created inside attachers.
          // `pluginId` can be used for those to ensure the completer runs once.
          otherCompleter.pluginId = 'foo'
          set.use(otherCompleter)

          /**
           * Second completer, a new function each time.
           *
           * @param {FileSet} set
           *   Set.
           * @returns {undefined}
           *   Nothing.
           */
          function otherCompleter(set) {
            otherCalls++
            checkSet(set, 2)
          }

          // First, this plugin is attached for `one.txt`, where it adds `two.txt`.
          // Then, this plugin is attached for `two.txt`, but it does not re-add
          // `two.txt` as it’s already added.
          assert.equal(
            set.add('two.txt'),
            set,
            'should be able to `add` a file'
          )
        }
      ],
      processor: noop,
      streamError: stderr.stream
    })

    assert.equal(result.code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')
    assert.equal(calls, 1)
    assert.equal(otherCalls, 1)

    /**
     * First completer.
     *
     * @param {FileSet} set
     *   Set.
     * @returns {undefined}
     *   Nothing.
     */
    function completer(set) {
      calls++
      checkSet(set, 1)
    }

    /**
     * Check a file set.
     *
     * @param {FileSet} set
     *   Set.
     * @param {number} nr
     *   Number.
     * @returns {undefined}
     *   Nothing.
     */
    function checkSet(set, nr) {
      const paths = set.files.map(function (file) {
        return file.path
      })

      assert.deepEqual(
        paths,
        ['one.txt', 'two.txt'],
        'should expose the files and set to `completer` (' + nr + ')'
      )
    }
  })

  await t.test(
    'should support `fileSet.add` from completers',
    async function () {
      const stderr = spy()
      /** @type {Array<string | undefined>} */
      const transformed = []
      let calls = 0

      const result = await engine({
        cwd: new URL('two-files/', fixtures),
        files: ['one.txt'],
        plugins: [
          function (_, fileSet) {
            const set = /** @type {FileSet} */ (fileSet)

            set.use(completer)

            return function (_, file) {
              transformed.push(file.stem)
            }
          }
        ],
        processor: noop,
        streamError: stderr.stream
      })

      assert.equal(result.code, 0)
      assert.equal(stderr(), 'one.txt: no issues found\n')
      assert.equal(calls, 1)
      assert.deepEqual(transformed, ['one', 'two'])

      /**
       * Completer that adds a file.
       *
       * @param {FileSet} set
       *   Set.
       * @returns {undefined}
       *   Nothing.
       */
      function completer(set) {
        calls++
        set.add('two.txt')
      }
    }
  )

  await t.test('should support `fileSet.add` from plugins', async function () {
    const cwd = new URL('extensions/', fixtures)
    const stderr = spy()
    const result = await engine({
      cwd,
      files: ['foo.txt'],
      output: 'nested/',
      plugins: [
        function (_, fileSet) {
          const set = /** @type {FileSet} */ (fileSet)
          set.add('bar.text')
        }
      ],
      processor: noop,
      streamError: stderr.stream
    })

    const url = new URL('nested/foo.txt', cwd)
    const document = String(await fs.readFile(url))

    await fs.unlink(url)

    assert.equal(result.code, 0)
    assert.equal(document, '')
    assert.equal(stderr(), 'foo.txt > nested' + path.sep + 'foo.txt: written\n')
  })
})
