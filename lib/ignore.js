import path from 'path'
import ignore from 'ignore'
import {FindUp} from './find-up.js'

Ignore.prototype.check = check

export function Ignore(options) {
  this.cwd = options.cwd
  this.ignorePathResolveFrom = options.ignorePathResolveFrom

  this.findUp = new FindUp({
    filePath: options.ignorePath,
    cwd: options.cwd,
    detect: options.detectIgnore,
    names: options.ignoreName ? [options.ignoreName] : [],
    create
  })
}

function check(filePath, callback) {
  const self = this

  self.findUp.load(filePath, done)

  function done(error, ignoreSet) {
    let normal

    if (error) {
      callback(error)
    } else if (ignoreSet) {
      normal = path.relative(
        path.resolve(
          self.cwd,
          self.ignorePathResolveFrom === 'cwd' ? '.' : ignoreSet.filePath
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
        callback(null, ignoreSet.ignores(normal))
      }
    } else {
      callback(null, false)
    }
  }
}

function create(buf, filePath) {
  const ignoreSet = ignore().add(String(buf))
  ignoreSet.filePath = path.dirname(filePath)
  return ignoreSet
}
