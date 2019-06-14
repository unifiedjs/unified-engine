'use strict'

var Ignore = require('../ignore')
var find = require('../finder')

module.exports = fileSystem

// Find files from the file-system.
function fileSystem(context, settings, next) {
  var input = context.files

  if (input.length === 0) {
    next()
  } else {
    find(
      input,
      {
        cwd: settings.cwd,
        extensions: settings.extensions,
        silentlyIgnore: settings.silentlyIgnore,
        ignorePatterns: settings.ignorePatterns,
        ignore: new Ignore({
          cwd: settings.cwd,
          detectIgnore: settings.detectIgnore,
          ignoreName: settings.ignoreName,
          ignorePath: settings.ignorePath
        })
      },
      onfound
    )
  }

  function onfound(error, result) {
    var output = result.files

    // Sort alphabetically.
    // Everything is unique so we do not care about cases where left and right
    // are equal.
    output.sort(sortAlphabetically)

    // Mark as given.
    // This allows outputting files, which can be pretty dangerous, so it’s
    // “hidden”.
    output.forEach(markAsGiven)

    context.files = output

    // If `out` was not set, detect it based on whether one file was given.
    if (settings.out === null || settings.out === undefined) {
      settings.out = result.oneFileMode
    }

    next(error)
  }

  function markAsGiven(file) {
    file.data.unifiedEngineGiven = true
  }

  function sortAlphabetically(left, right) {
    return left.path < right.path ? -1 : 1
  }
}
