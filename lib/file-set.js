import {EventEmitter} from 'events'
import {trough} from 'trough'
import {toVFile} from 'to-vfile'

// FileSet constructor.
export class FileSet extends EventEmitter {
  constructor() {
    super()

    this.files = []
    this.origins = []

    this.expected = 0
    this.actual = 0

    this.pipeline = trough()
    this.plugins = []

    // Called when a single file has completed it’s pipeline, triggering `done`
    // when all files are complete.
    this.on('one', () => {
      this.actual++

      if (this.actual >= this.expected) {
        this.emit('done')
      }
    })
  }

  // Create an array representation of `fileSet`.
  valueOf() {
    return this.files
  }

  // Attach middleware to the pipeline on `fileSet`.
  use(plugin) {
    const pipeline = this.pipeline
    let duplicate = false

    if (plugin && plugin.pluginId) {
      duplicate = this.plugins.some((fn) => fn.pluginId === plugin.pluginId)
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

  // Add a file to be processed.
  // Ignores duplicate files (based on the `filePath` at time of addition).
  // Only runs `file-pipeline` on files which have not `failed` before addition.
  add(file) {
    if (typeof file === 'string') {
      file = toVFile(file)
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
    setImmediate(() => {
      this.emit('add', file)
    })

    return this
  }
}
