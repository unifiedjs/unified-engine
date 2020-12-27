'use strict'

var fs = require('fs')
var path = require('path')
var debug = require('debug')('unified-engine:file-pipeline:copy')

module.exports = copy

// Move a file.
function copy(context, file, fileSet, next) {
  var output = context.output
  var outpath = output
  var currentPath = file.path

  if (typeof outpath !== 'string') {
    debug('Not copying')
    return next()
  }

  outpath = path.resolve(context.cwd, outpath)

  debug('Copying `%s`', currentPath)

  fs.stat(outpath, onstatfile)

  function onstatfile(error, stats) {
    if (error) {
      if (
        error.code !== 'ENOENT' ||
        output.charAt(output.length - 1) === path.sep
      ) {
        return next(
          new Error('Cannot read output directory. Error:\n' + error.message)
        )
      }

      fs.stat(path.dirname(outpath), onstatparent)
    } else {
      done(stats.isDirectory())
    }
  }

  // This is either given an error, or the parent exists which is a directory,
  // but we should keep the basename of the given file.
  function onstatparent(error) {
    if (error) {
      next(new Error('Cannot read parent directory. Error:\n' + error.message))
    } else {
      done(false)
    }
  }

  function done(directory) {
    if (!directory && fileSet.expected > 1) {
      return next(
        new Error('Cannot write multiple files to single output: ' + outpath)
      )
    }

    file[directory ? 'dirname' : 'path'] = path.relative(file.cwd, outpath)

    debug('Copying document from %s to %s', currentPath, file.path)

    next()
  }
}
