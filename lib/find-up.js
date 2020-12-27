'use strict'

var fs = require('fs')
var path = require('path')
var fault = require('fault')
var debug = require('debug')('unified-engine:find-up')

module.exports = FindUp

FindUp.prototype.load = load

function FindUp(options) {
  var self = this

  self.cache = {}
  self.cwd = options.cwd
  self.detect = options.detect
  self.names = options.names
  self.create = options.create

  if (options.filePath) {
    self.givenFilePath = path.resolve(options.cwd, options.filePath)
  }
}

function load(filePath, callback) {
  var self = this
  var givenFile = self.givenFile
  var parent

  if (self.givenFilePath) {
    if (givenFile) {
      apply(callback, givenFile)
    } else {
      givenFile = [callback]
      self.givenFile = givenFile
      debug('Checking given file `%s`', self.givenFilePath)
      fs.readFile(self.givenFilePath, loadGiven)
    }

    return
  }

  if (!self.detect) {
    return callback()
  }

  filePath = path.resolve(self.cwd, filePath)
  parent = path.dirname(filePath)

  if (parent in self.cache) {
    apply(callback, self.cache[parent])
  } else {
    self.cache[parent] = [callback]
    find(parent)
  }

  function loadGiven(error, buf) {
    var cbs = self.givenFile
    var result

    if (error) {
      result = fault(
        'Cannot read given file `%s`\n%s',
        path.relative(self.cwd, self.givenFilePath),
        error.stack
      )
      result.code = 'ENOENT'
      result.path = error.path
      result.syscall = error.syscall
    } else {
      try {
        result = self.create(buf, self.givenFilePath)
        debug('Read given file `%s`', self.givenFilePath)
      } catch (error_) {
        result = fault(
          'Cannot parse given file `%s`\n%s',
          path.relative(self.cwd, self.givenFilePath),
          error_.stack
        )
        debug(error_.message)
      }
    }

    givenFile = result
    self.givenFile = result
    applyAll(cbs, result)
  }

  function find(directory) {
    var index = -1

    next()

    function next() {
      var parent

      // Try to read the next file.
      // We do not use `readdir` because on huge directories, that could be
      // *very* slow.
      if (++index < self.names.length) {
        fs.readFile(path.join(directory, self.names[index]), done)
      } else {
        parent = path.dirname(directory)

        if (directory === parent) {
          debug('No files found for `%s`', filePath)
          found()
        } else if (parent in self.cache) {
          apply(found, self.cache[parent])
        } else {
          self.cache[parent] = [found]
          find(parent)
        }
      }
    }

    function done(error, buf) {
      var fp = path.join(directory, self.names[index])
      var contents

      /* istanbul ignore if - Hard to test. */
      if (error) {
        if (error.code === 'ENOENT') {
          return next()
        }

        error = fault(
          'Cannot read file `%s`\n%s',
          path.relative(self.cwd, fp),
          error.message
        )
        debug(error.message)
        return found(error)
      }

      try {
        contents = self.create(buf, fp)
      } catch (error_) {
        return found(
          fault(
            'Cannot parse file `%s`\n%s',
            path.relative(self.cwd, fp),
            error_.message
          )
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
      var cbs = self.cache[directory]
      self.cache[directory] = error || result
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
    if (
      result !== null &&
      typeof result === 'object' &&
      typeof result[0] === 'function'
    ) {
      result.push(cb)
    } else if (result instanceof Error) {
      cb(result)
    } else {
      cb(null, result)
    }
  }
}
