/**
 * @typedef {import('trough').Pipeline} Pipeline
 */

/**
 * @typedef {(CompleterCallback | CompleterAsync | CompleterSync) & {pluginId?: string | undefined}} Completer
 *   Completer.
 *
 * @callback CompleterAsync
 *   Handle a set having processed, in promise-style.
 * @param {FileSet} set
 *   File set.
 * @returns {Promise<undefined>}
 *   Nothing.
 *
 * @callback CompleterCallback
 *   Handle a set having processed, in callback-style.
 * @param {FileSet} set
 *   File set.
 * @param {CompleterCallbackNext} next
 *   Callback called when done.
 * @returns {undefined | void}
 *   Result.
 *
 *   Note: `void` included because TS sometimes infers it.
 *
 * @callback CompleterCallbackNext
 *   Callback called when done.
 * @param {Error | null | undefined} [error]
 *   Error.
 * @returns {undefined}
 *   Nothing.
 *
 * @callback CompleterSync
 *   Handle a set having processed, synchronously.
 * @param {FileSet} set
 *   File set.
 * @returns {undefined | void}
 *   Nothing.
 *
 *   Note: `void` included because TS sometimes infers it.
 */

import {EventEmitter} from 'node:events'
import {trough} from 'trough'
import {VFile} from 'vfile'

export class FileSet extends EventEmitter {
  /**
   * FileSet.
   *
   * A FileSet is created to process multiple files through unified processors.
   * This set, containing all files, is exposed to plugins as an argument to the
   * attacher.
   */
  constructor() {
    super()

    const self = this

    /** @type {number} */
    this.actual = 0
    /**
     * This is used by the `queue` to stash async work.
     *
     * @type {Record<string, Function>}
     */
    this.complete = {}
    /** @type {number} */
    this.expected = 0
    /** @type {Array<VFile>} */
    this.files = []
    /** @type {Array<string>} */
    this.origins = []
    /** @type {Pipeline} */
    this.pipeline = trough()
    /** @type {Array<Completer>} */
    this.plugins = []

    // Called when a single file has completed it’s pipeline, triggering `done`
    // when all files are complete.
    this.on('one', function () {
      self.actual++

      if (self.actual >= self.expected) {
        self.emit('done')
      }
    })
  }

  /**
   * Access the files in a set.
   */
  valueOf() {
    return this.files
  }

  /**
   * Attach middleware to the pipeline on `fileSet`.
   *
   * @param {Completer} plugin
   *   Plugin.
   * @returns
   *   Self.
   */
  use(plugin) {
    const pipeline = this.pipeline
    let duplicate = false

    if (plugin && plugin.pluginId) {
      duplicate = this.plugins.some(function (fn) {
        return fn.pluginId === plugin.pluginId
      })
    }

    if (!duplicate && this.plugins.includes(plugin)) {
      duplicate = true
    }

    if (!duplicate) {
      this.plugins.push(plugin)
      pipeline.use(plugin)
    }

    return this
  }

  /**
   * Add a file to be processed.
   *
   * The given file is processed like other files with a few differences:
   *
   * *   Ignored when their file path is already added
   * *   Never written to the file system or streamOut
   * *   Not reported for
   *
   * @param {VFile | string} file
   *   File or file path.
   * @returns
   *   Self.
   */
  add(file) {
    const self = this

    if (typeof file === 'string') {
      file = new VFile({path: file})
    }

    // Prevent files from being added multiple times.
    if (this.origins.includes(file.history[0])) {
      return this
    }

    this.origins.push(file.history[0])

    // Add.
    this.valueOf().push(file)
    this.expected++

    // Force an asynchronous operation.
    // This ensures that files which fall through the file pipeline immediately
    // (such as, when already fatally failed) still queue up correctly.
    setImmediate(function () {
      self.emit('add', file)
    })

    return this
  }
}
