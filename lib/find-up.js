'use strict'

var fs = require('fs')
var path = require('path')
var fault = require('fault')
var debug = require('debug')('unified-engine:find-up')
var object = require('is-object')

module.exports = FindUp

var read = fs.readFile
var resolve = path.resolve
var relative = path.relative
var join = path.join
var dirname = path.dirname

FindUp.prototype.load = load

function FindUp(options) {
  var self = this
  var fp = options.filePath

  self.cache = {}
  self.cwd = options.cwd
  self.detect = options.detect
  self.names = options.names
  self.create = options.create

  if (fp) {
    self.givenFilePath = resolve(options.cwd, fp)
  }
}

function load(filePath, callback) {
  var self = this
  var cache = self.cache
  var givenFilePath = self.givenFilePath
  var givenFile = self.givenFile
  var names = self.names
  var create = self.create
  var cwd = self.cwd
  var parent

  if (givenFilePath) {
    if (givenFile) {
      apply(callback, givenFile)
    } else {
      givenFile = [callback]
      self.givenFile = givenFile
      debug('Checking given file `%s`', givenFilePath)
      read(givenFilePath, loadGiven)
    }

    return
  }

  if (!self.detect) {
    return callback()
  }

  filePath = resolve(cwd, filePath)
  parent = dirname(filePath)

  if (parent in cache) {
    apply(callback, cache[parent])
  } else {
    cache[parent] = [callback]
    find(parent)
  }

  function loadGiven(error, buf) {
    var cbs = self.givenFile
    var result

    if (error) {
      result = fault(
        'Cannot read given file `%s`\n%s',
        relative(cwd, givenFilePath),
        error.stack
      )
      result.code = 'ENOENT'
      result.path = error.path
      result.syscall = error.syscall
    } else {
      try {
        result = create(buf, givenFilePath)
        debug('Read given file `%s`', givenFilePath)
      } catch (error2) {
        result = fault(
          'Cannot parse given file `%s`\n%s',
          relative(cwd, givenFilePath),
          error2.stack
        )
        debug(error2.message)
      }
    }

    givenFile = result
    self.givenFile = result
    applyAll(cbs, result)
  }

  function find(directory) {
    var index = -1
    var length = names.length

    next()

    function next() {
      var parent

      // Try to read the next file.
      // We do not use `readdir` because on huge directories, that could be
      // *very* slow.
      if (++index < length) {
        read(join(directory, names[index]), done)
      } else {
        parent = dirname(directory)

        if (directory === parent) {
          debug('No files found for `%s`', filePath)
          found()
        } else if (parent in cache) {
          apply(found, cache[parent])
        } else {
          cache[parent] = [found]
          find(parent)
        }
      }
    }

    function done(error, buf) {
      var name = names[index]
      var fp = join(directory, name)
      var contents

      /* istanbul ignore if - Hard to test. */
      if (error) {
        if (error.code === 'ENOENT') {
          return next()
        }

        error = fault(
          'Cannot read file `%s`\n%s',
          relative(cwd, fp),
          error.message
        )
        debug(error.message)
        return found(error)
      }

      try {
        contents = create(buf, fp)
      } catch (error2) {
        return found(
          fault('Cannot parse file `%s`\n%s', relative(cwd, fp), error2.message)
        )
      }

      /* istanbul ignore else - maybe used in the future. */
      if (contents) {
        debug('Read file `%s`', fp)
        found(null, contents)
      } else {
        next()
      }
    }

    function found(error, result) {
      var cbs = cache[directory]
      cache[directory] = error || result
      applyAll(cbs, error || result)
    }
  }

  function applyAll(cbs, result) {
    var index = cbs.length

    while (index--) {
      apply(cbs[index], result)
    }
  }

  function apply(cb, result) {
    if (object(result) && typeof result[0] === 'function') {
      result.push(cb)
    } else if (result instanceof Error) {
      cb(result)
    } else {
      cb(null, result)
    }
  }
}
