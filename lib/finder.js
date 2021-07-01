import path from 'path'
import fs from 'fs'
import ignore from 'ignore'
import glob from 'glob'
import toVFile from 'to-vfile'

// Search `patterns`, a mix of globs, paths, and files.
export function finder(input, options, callback) {
  expand(input, options, done)

  function done(error, result) {
    // Glob errors are unusual.
    // other errors are on the vfile results.
    /* c8 ignore next 2 */
    if (error) {
      callback(error)
    } else {
      callback(null, {oneFileMode: oneFileMode(result), files: result.output})
    }
  }
}

// Expand the given glob patterns, search given and found directories, and map
// to vfiles.
function expand(input, options, next) {
  let paths = []
  let actual = 0
  let expected = 0
  let failed

  let index = -1

  while (++index < input.length) {
    let file = input[index]
    if (typeof file === 'string') {
      if (glob.hasMagic(file)) {
        expected++
        glob(file, {cwd: options.cwd}, one)
      } else {
        // `relative` to make the paths canonical.
        file =
          path.relative(options.cwd, path.resolve(options.cwd, file)) || '.'
        paths.push(file)
      }
    } else {
      file.cwd = options.cwd
      file.path = path.relative(options.cwd, file.path)
      file.history = [file.path]
      paths.push(file)
    }
  }

  if (!expected) {
    search(paths, options, done)
  }

  function one(error, files) {
    // Glob errors are unusual.
    /* c8 ignore next 3 */
    if (failed) {
      return
    }

    // Glob errors are unusual.
    /* c8 ignore next 4 */
    if (error) {
      failed = true
      done(error)
    } else {
      actual++
      paths = paths.concat(files)

      if (actual === expected) {
        search(paths, options, done)
      }
    }
  }

  function done(error, files) {
    // `search` currently does not give errors.
    /* c8 ignore next 2 */
    if (error) {
      next(error)
    } else {
      next(null, {input: paths, output: files})
    }
  }
}

// Search `paths`.
function search(input, options, next) {
  const extraIgnore = ignore().add(options.ignorePatterns)
  let files = []
  let expected = 0
  let actual = 0
  let index = -1

  while (++index < input.length) {
    each(input[index])
  }

  if (!expected) {
    next(null, files)
  }

  return each

  function each(file) {
    const ext = typeof file === 'string' ? path.extname(file) : file.extname

    // Normalise globs.
    if (typeof file === 'string') {
      file = file.split('/').join(path.sep)
    }

    const part = base(file)

    if (options.nested && (part.charAt(0) === '.' || part === 'node_modules')) {
      return
    }

    expected++

    statAndIgnore(file, Object.assign({}, options, {extraIgnore}), handle)

    function handle(error, result) {
      const ignored = result && result.ignored
      const dir = result && result.stats && result.stats.isDirectory()

      if (ignored && (options.nested || options.silentlyIgnore)) {
        return one(null, [])
      }

      if (!ignored && dir) {
        return fs.readdir(path.resolve(options.cwd, filePath(file)), directory)
      }

      if (
        !dir &&
        options.nested &&
        options.extensions.length > 0 &&
        !options.extensions.includes(ext)
      ) {
        return one(null, [])
      }

      file = toVFile(file)
      file.cwd = options.cwd

      if (ignored) {
        try {
          file.fail('Cannot process specified file: it’s ignored')
        } catch {}
      }

      if (error && error.code === 'ENOENT') {
        try {
          file.fail(
            error.syscall === 'stat' ? 'No such file or directory' : error
          )
        } catch {}
      }

      one(null, [file])
    }

    function directory(error, basenames) {
      let otherFile

      // Should not happen often: the directory is `stat`ed first, which was ok,
      // but reading it is not.
      /* c8 ignore next 9 */
      if (error) {
        otherFile = toVFile(filePath(otherFile))
        otherFile.cwd = options.cwd

        try {
          otherFile.fail('Cannot read directory')
        } catch {}

        one(null, [otherFile])
      } else {
        search(
          basenames.map((name) => path.join(filePath(file), name)),
          Object.assign({}, options, {nested: true}),
          one
        )
      }
    }

    // Error is never given. Always given `results`.
    function one(_, results) {
      /* istanbul ignore else - Always given. */
      if (results) {
        files = files.concat(results)
      }

      actual++

      if (actual === expected) {
        next(null, files)
      }
    }
  }
}

function statAndIgnore(file, options, callback) {
  const fp = path.resolve(options.cwd, filePath(file))
  const normal = path.relative(options.cwd, fp)
  let expected = 1
  let actual = 0
  let stats
  let ignored

  if (!file.contents) {
    expected++
    fs.stat(fp, handleStat)
  }

  options.ignore.check(fp, handleIgnore)

  function handleStat(error, value) {
    stats = value
    one(error)
  }

  function handleIgnore(error, value) {
    ignored = value
    one(error)
  }

  function one(error) {
    actual++

    if (error) {
      callback(error)
      actual = -1
    } else if (actual === expected) {
      callback(null, {
        stats,
        ignored:
          ignored ||
          (normal === '' ||
          normal === '..' ||
          normal.charAt(0) === path.sep ||
          normal.slice(0, 3) === '..' + path.sep
            ? false
            : options.extraIgnore.ignores(normal))
      })
    }
  }
}

function base(file) {
  return typeof file === 'string' ? path.basename(file) : file.basename
}

function filePath(file) {
  return typeof file === 'string' ? file : file.path
}

function oneFileMode(result) {
  return (
    result.output.length === 1 &&
    result.input.length === 1 &&
    result.output[0].path === result.input[0]
  )
}
