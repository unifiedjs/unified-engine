'use strict'

var events = require('events')
var inherits = require('util').inherits
var trough = require('trough')
var vfile = require('to-vfile')

module.exports = FileSet

// FileSet constructor.
function FileSet() {
  var self = this

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
  var self = this
  var pipeline = self.pipeline
  var duplicate = false

  if (plugin && plugin.pluginId) {
    duplicate = self.plugins.some(matches)
  }

  if (!duplicate && self.plugins.indexOf(plugin) !== -1) {
    duplicate = true
  }

  if (!duplicate) {
    self.plugins.push(plugin)
    pipeline.use(plugin)
  }

  return self

  function matches(fn) {
    return fn.pluginId === plugin.pluginId
  }
}

// Add a file to be processed.
// Ignores duplicate files (based on the `filePath` at time of addition).
// Only runs `file-pipeline` on files which have not `failed` before addition.
function add(file) {
  var self = this

  if (typeof file === 'string') {
    file = vfile(file)
  }

  // Prevent files from being added multiple times.
  if (self.origins.indexOf(file.history[0]) !== -1) {
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
  var self = this

  self.actual++

  if (self.actual >= self.expected) {
    self.emit('done')
  }
}
