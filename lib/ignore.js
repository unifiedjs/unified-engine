import path from 'path'
import ignore from 'ignore'
import {FindUp} from './find-up.js'

export class Ignore {
  constructor(options) {
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

  check(filePath, callback) {
    this.findUp.load(filePath, (error, ignoreSet) => {
      let normal

      if (error) {
        callback(error)
      } else if (ignoreSet) {
        normal = path.relative(
          path.resolve(
            this.cwd,
            this.ignorePathResolveFrom === 'cwd' ? '.' : ignoreSet.filePath
          ),
          path.resolve(this.cwd, filePath)
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
    })
  }
}

function create(buf, filePath) {
  const ignoreSet = ignore().add(String(buf))
  ignoreSet.filePath = path.dirname(filePath)
  return ignoreSet
}
