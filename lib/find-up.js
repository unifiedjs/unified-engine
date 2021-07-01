import fs from 'fs'
import path from 'path'
import fault from 'fault'
import createDebug from 'debug'
import wrap from 'trough/wrap.js'

const debug = createDebug('unified-engine:find-up')

export class FindUp {
  constructor(options) {
    this.cache = {}
    this.cwd = options.cwd
    this.detect = options.detect
    this.names = options.names
    this.create = options.create

    if (options.filePath) {
      this.givenFilePath = path.resolve(options.cwd, options.filePath)
    }
  }

  load(filePath, callback) {
    const self = this
    let givenFile = this.givenFile

    if (this.givenFilePath) {
      if (givenFile) {
        apply(callback, givenFile)
      } else {
        givenFile = [callback]
        this.givenFile = givenFile
        debug('Checking given file `%s`', this.givenFilePath)
        fs.readFile(this.givenFilePath, (error, buf) => {
          const cbs = this.givenFile
          let result

          if (error) {
            result = fault(
              'Cannot read given file `%s`\n%s',
              path.relative(this.cwd, this.givenFilePath),
              error.stack
            )
            result.code = 'ENOENT'
            result.path = error.path
            result.syscall = error.syscall
            loaded(result)
          } else {
            wrap(this.create, onparse)(buf, this.givenFilePath)
          }

          function onparse(error, result) {
            if (error) {
              debug(error.message)
              loaded(
                fault(
                  'Cannot parse given file `%s`\n%s',
                  path.relative(self.cwd, self.givenFilePath),
                  error.stack
                )
              )
            } else {
              debug('Read given file `%s`', self.givenFilePath)
              loaded(result)
            }
          }

          function loaded(result) {
            givenFile = result
            self.givenFile = result
            applyAll(cbs, result)
          }
        })
      }

      return
    }

    if (!this.detect) {
      return callback()
    }

    filePath = path.resolve(this.cwd, filePath)
    const parent = path.dirname(filePath)

    if (parent in this.cache) {
      apply(callback, this.cache[parent])
    } else {
      this.cache[parent] = [callback]
      find(parent)
    }

    function find(directory) {
      let index = -1

      next()

      function next() {
        let parent

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
        const fp = path.join(directory, self.names[index])

        if (error) {
          // Hard to test.
          /* c8 ignore next 13 */
          if (error.code === 'ENOENT') {
            return next()
          }

          debug(error.message)
          return found(
            fault(
              'Cannot read file `%s`\n%s',
              path.relative(self.cwd, fp),
              error.message
            )
          )
        }

        wrap(self.create, onparse)(buf, fp)

        function onparse(error, result) {
          if (error) {
            found(
              fault(
                'Cannot parse file `%s`\n%s',
                path.relative(self.cwd, fp),
                error.message
              )
            )
          } else if (result) {
            debug('Read file `%s`', fp)
            found(null, result)
          } else {
            next()
          }
        }
      }

      function found(error, result) {
        const cbs = self.cache[directory]
        self.cache[directory] = error || result
        applyAll(cbs, error || result)
      }
    }

    function applyAll(cbs, result) {
      let index = cbs.length

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
}
