'use strict'

var path = require('path')
var gitignore = require('ignore')
var FindUp = require('./find-up.js')

module.exports = Ignore

Ignore.prototype.check = check

function Ignore(options) {
  this.cwd = options.cwd
  this.ignorePathResolveFrom = options.ignorePathResolveFrom

  this.findUp = new FindUp({
    filePath: options.ignorePath,
    cwd: options.cwd,
    detect: options.detectIgnore,
    names: options.ignoreName ? [options.ignoreName] : [],
    create: create
  })
}

function check(filePath, callback) {
  var self = this

  self.findUp.load(filePath, done)

  function done(error, ignore) {
    var normal

    if (error) {
      callback(error)
    } else if (ignore) {
      normal = path.relative(
        path.resolve(
          self.cwd,
          self.ignorePathResolveFrom === 'cwd' ? '.' : ignore.filePath
        ),
        path.resolve(self.cwd, filePath)
      )

      if (
        normal === '' ||
        normal === '..' ||
        normal.charAt(0) === path.sep ||
        normal.slice(0, 3) === '..' + path.sep
      ) {
        callback(null, false)
      } else {
        callback(null, ignore.ignores(normal))
      }
    } else {
      callback(null, false)
    }
  }
}

function create(buf, filePath) {
  var ignore = gitignore().add(String(buf))
  ignore.filePath = path.dirname(filePath)
  return ignore
}
