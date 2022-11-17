/**
 * @typedef {import('unified').Plugin<[unknown, FileSet]>} FileSetPlugin
 * @typedef {import('../index.js').FileSet} FileSet
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import {sep} from 'node:path'
import test from 'node:test'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('completers', async () => {
  await new Promise((resolve) => {
    const stderr = spy()

    otherCompleter.pluginId = 'foo'

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        plugins: [
          /** @type {FileSetPlugin} */
          (_, set) => {
            assert.equal(typeof set, 'object', 'should pass a set')
            assert.equal(
              typeof set.use,
              'function',
              'should have a `use` method'
            )
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
        cwd: new URL('two-files/', fixtures),
        files: ['one.txt']
      },
      (error, code) => {
        assert.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should pass `fileSet` to plugins'
        )
        resolve(undefined)
      }
    )

    // Most often, completers cannot be detected to be the same because they are
    // created inside attachers.
    // `pluginId` can be used for those to ensure the completer runs once.
    /** @param {FileSet} set */
    function otherCompleter(set) {
      checkSet(set, 2)
    }

    /** @param {FileSet} set */
    function completer(set) {
      checkSet(set, 1)
    }

    /**
     * @param {FileSet} set
     * @param {number} nr
     */
    function checkSet(set, nr) {
      const paths = set.files.map((file) => file.path)

      assert.deepEqual(
        paths,
        ['one.txt', 'two.txt'],
        'should expose the files and set to `completer` (' + nr + ')'
      )
    }
  })

  await new Promise((resolve) => {
    const cwd = new URL('extensions/', fixtures)
    const stderr = spy()

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        plugins: [
          /** @type {FileSetPlugin} */
          (_, set) => {
            set.add('bar.text')
          }
        ],
        cwd,
        files: ['foo.txt'],
        output: 'nested/'
      },
      (error, code) => {
        const url = new URL('nested/foo.txt', cwd)
        const doc = fs.readFileSync(url, 'utf8')

        fs.unlinkSync(url)

        assert.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, '', 'foo.txt > nested' + sep + 'foo.txt: written\n'],
          'should pass `fileSet` to plugins'
        )

        resolve(undefined)
      }
    )
  })
})
