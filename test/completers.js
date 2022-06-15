/**
 * @typedef {import('unified').Plugin<[unknown, FileSet]>} FileSetPlugin
 * @typedef {import('../index.js').FileSet} FileSet
 */

import fs from 'node:fs'
import {sep} from 'node:path'
import {fileURLToPath} from 'node:url'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('completers', (t) => {
  t.plan(2)

  t.test('should pass `fileSet` to plugins', (t) => {
    const stderr = spy()

    otherCompleter.pluginId = 'foo'

    // 5 in the attacher, which is called 2 times, 1 in `checkSet`, which is
    // called 2 times, 1 in the callback.
    t.plan(13)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        plugins: [
          /** @type {FileSetPlugin} */
          (_, set) => {
            t.equal(typeof set, 'object', 'should pass a set')
            t.equal(typeof set.use, 'function', 'should have a `use` method')
            t.equal(typeof set.add, 'function', 'should have an `add` method')

            // The completer is added multiple times, but it’s detected that its the
            // same function so it runs once.
            t.equal(
              set.use(completer),
              set,
              'should be able to `use` a completer'
            )

            set.use(otherCompleter)

            // First, this plugin is attached for `one.txt`, where it adds `two.txt`.
            // Then, this plugin is attached for `two.txt`, but it does not re-add
            // `two.txt` as it’s already added.
            t.equal(set.add('two.txt'), set, 'should be able to `add` a file')
          }
        ],
        cwd: fileURLToPath(new URL('two-files/', fixtures)),
        files: ['one.txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
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

      t.deepEqual(
        paths,
        ['one.txt', 'two.txt'],
        'should expose the files and set to `completer` (' + nr + ')'
      )
    }
  })

  t.test('should pass `fileSet` to plugins', (t) => {
    const cwd = new URL('extensions/', fixtures)
    const stderr = spy()

    t.plan(1)

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
        cwd: fileURLToPath(cwd),
        files: ['foo.txt'],
        output: 'nested/'
      },
      (error, code) => {
        const url = new URL('nested/foo.txt', cwd)
        const doc = fs.readFileSync(url, 'utf8')

        fs.unlinkSync(url)

        t.deepEqual(
          [error, code, doc, stderr()],
          [null, 0, '', 'foo.txt > nested' + sep + 'foo.txt: written\n'],
          'should work'
        )
      }
    )
  })
})
