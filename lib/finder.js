'use strict'

var path = require('path')
var fs = require('fs')
var gitignore = require('ignore')
var glob = require('glob')
var vfile = require('to-vfile')

module.exports = find

// Search `patterns`, a mix of globs, paths, and files.
function find(input, options, callback) {
  expand(input, options, done)

  function done(error, result) {
    /* istanbul ignore if - glob errors are unusual.
     * other errors are on the vfile results. */
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
  var paths = []
  var actual = 0
  var expected = 0
  var failed

  input.forEach(each)

  if (!expected) {
    search(paths, options, done)
  }

  function each(file) {
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

  function one(error, files) {
    /* istanbul ignore if - Glob errors are unusual. */
    if (failed) {
      return
    }

    /* istanbul ignore if - Glob errors are unusual. */
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
    /* istanbul ignore if - `search` currently does not give errors. */
    if (error) {
      next(error)
    } else {
      next(null, {input: paths, output: files})
    }
  }
}

// Search `paths`.
function search(input, options, next) {
  var extraIgnore = gitignore().add(options.ignorePatterns)
  var files = []
  var expected = 0
  var actual = 0

  input.forEach(each)

  if (!expected) {
    next(null, files)
  }

  return each

  function each(file) {
    var ext = typeof file === 'string' ? path.extname(file) : file.extname
    var part

    // Normalise globs.
    if (typeof file === 'string') {
      file = file.split('/').join(path.sep)
    }

    part = base(file)

    if (options.nested && (part.charAt(0) === '.' || part === 'node_modules')) {
      return
    }

    expected++

    statAndIgnore(
      file,
      Object.assign({}, options, {extraIgnore: extraIgnore}),
      handle
    )

    function handle(error, result) {
      var ignored = result && result.ignored
      var dir = result && result.stats && result.stats.isDirectory()

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
        options.extensions.indexOf(ext) === -1
      ) {
        return one(null, [])
      }

      file = vfile(file)
      file.cwd = options.cwd

      if (ignored) {
        try {
          file.fail('Cannot process specified file: it’s ignored')
        } catch (_) {}
      }

      if (error && error.code === 'ENOENT') {
        try {
          file.fail(
            error.syscall === 'stat' ? 'No such file or directory' : error
          )
        } catch (_) {}
      }

      one(null, [file])
    }

    function directory(error, basenames) {
      var file

      /* istanbul ignore if - Should not happen often: the directory is `stat`ed
       * first, which was ok, but reading it is not. */
      if (error) {
        file = vfile(filePath(file))
        file.cwd = options.cwd

        try {
          file.fail('Cannot read directory')
        } catch (_) {}

        one(null, [file])
      } else {
        search(
          basenames.map(concat),
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

    function concat(value) {
      return path.join(filePath(file), value)
    }
  }
}

function statAndIgnore(file, options, callback) {
  var fp = path.resolve(options.cwd, filePath(file))
  var normal = path.relative(options.cwd, fp)
  var expected = 1
  var actual = 0
  var stats
  var ignored

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
        stats: stats,
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
