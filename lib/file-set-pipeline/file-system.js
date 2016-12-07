'use strict';

var path = require('path');
var Ignore = require('../ignore');
var Finder = require('../finder');

module.exports = fileSystem;

var relative = path.relative;

/* Find files from the file-system. */
function fileSystem(context, settings, next) {
  var skip = settings.silentlyIgnore;

  var ignore = new Ignore({
    cwd: settings.cwd,
    detectIgnore: settings.detectIgnore,
    ignoreName: settings.ignoreName,
    ignorePath: settings.ignorePath
  });

  var finder = new Finder({
    cwd: settings.cwd,
    extensions: settings.extensions,
    out: settings.out,
    ignore: ignore,
    silentlyIgnore: skip
  });

  ignore.loadPatterns(done);

  function done() {
    var files = context.files;
    var injected = Boolean(files.length);
    var globs = settings.globs;

    /* Use injected files. */
    if (injected) {
      files = files.filter(filter);
    }

    if (!globs.length) {
      context.files = files;
      return next();
    }

    finder.find(globs, find);

    function find(err, found) {
      context.files = files.concat(found);

      /* If `out` wasn’t set, detect it based on
       * whether one file was given. */
      if (settings.out == null) {
        settings.out = !injected && finder.oneFileMode;
      }

      next(err);
    }
  }

  function filter(file) {
    var message;

    file.cwd = settings.cwd;
    file.dirname = relative(file.cwd, file.dirname);
    file.history = [file.path];

    if (ignore.check(file.path)) {
      if (skip) {
        return false;
      }

      message = file.message('Cannot process given file: it’s ignored');
      message.fatal = true;
    }

    file.data.unifiedEngineGiven = true;

    return true;
  }
}
