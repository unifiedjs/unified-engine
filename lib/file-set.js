import events from 'events'
import {inherits} from 'util'
import trough from 'trough'
import toVFile from 'to-vfile'

// FileSet constructor.
export function FileSet() {
  const self = this

  self.files = []
  self.origins = []

  self.expected = 0
  self.actual = 0

  self.pipeline = trough()
  self.plugins = []

  events.init.call(self)

  self.on('one', one.bind(self))
}

// Events.
inherits(FileSet, events.EventEmitter)

// Expose methods.
FileSet.prototype.valueOf = valueOf
FileSet.prototype.use = use
FileSet.prototype.add = add

// Create an array representation of `fileSet`.
function valueOf() {
  return this.files
}

// Attach middleware to the pipeline on `fileSet`.
function use(plugin) {
  const self = this
  const pipeline = self.pipeline
  let duplicate = false

  if (plugin && plugin.pluginId) {
    duplicate = self.plugins.some((fn) => fn.pluginId === plugin.pluginId)
  }

  if (!duplicate && self.plugins.includes(plugin)) {
    duplicate = true
  }

  if (!duplicate) {
    self.plugins.push(plugin)
    pipeline.use(plugin)
  }

  return self
}

// Add a file to be processed.
// Ignores duplicate files (based on the `filePath` at time of addition).
// Only runs `file-pipeline` on files which have not `failed` before addition.
function add(file) {
  const self = this

  if (typeof file === 'string') {
    file = toVFile(file)
  }

  // Prevent files from being added multiple times.
  if (self.origins.includes(file.history[0])) {
    return self
  }

  self.origins.push(file.history[0])

  // Add.
  self.valueOf().push(file)
  self.expected++

  // Force an asynchronous operation.
  // This ensures that files which fall through the file pipeline immediately
  // (such as, when already fatally failed) still queue up correctly.
  setImmediate(add)

  return self

  function add() {
    self.emit('add', file)
  }
}

// Utility invoked when a single file has completed it's pipeline, triggering
// `done` when all files are complete.
function one() {
  const self = this

  self.actual++

  if (self.actual >= self.expected) {
    self.emit('done')
  }
}
