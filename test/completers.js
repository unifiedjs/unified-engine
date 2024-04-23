/**
 * @typedef {import('unified-engine').FileSet} FileSet
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {sep} from 'node:path'
import test from 'node:test'
import {promisify} from 'node:util'
import {engine} from 'unified-engine'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const run = promisify(engine)
const fixtures = new URL('fixtures/', import.meta.url)

test('completers', async function (t) {
  await t.test('should pass `fileSet` to plugins', async function () {
    const stderr = spy()

    // Most often, completers cannot be detected to be the same because they are
    // created inside attachers.
    // `pluginId` can be used for those to ensure the completer runs once.
    otherCompleter.pluginId = 'foo'

    const code = await run({
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

          set.use(otherCompleter)

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

    assert.equal(code, 0)
    assert.equal(stderr(), 'one.txt: no issues found\n')

    /**
     * @param {FileSet} set
     *   Set.
     * @returns {undefined}
     *   Nothing.
     */
    function otherCompleter(set) {
      checkSet(set, 2)
    }

    /**
     * @param {FileSet} set
     *   Set.
     * @returns {undefined}
     *   Nothing.
     */
    function completer(set) {
      checkSet(set, 1)
    }

    /**
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

  await t.test('should support `fileSet.add` from plugins', async function () {
    const cwd = new URL('extensions/', fixtures)
    const stderr = spy()
    const code = await run({
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

    assert.equal(code, 0)
    assert.equal(document, '')
    assert.equal(stderr(), 'foo.txt > nested' + sep + 'foo.txt: written\n')
  })
})
