/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-set-pipeline:file-system
 * @fileoverview Find files from the file-system.
 */

'use strict';

/* Dependencies. */
var path = require('path');
var Ignore = require('../ignore');
var Finder = require('../finder');

/* Expose. */
module.exports = fileSystem;

/* Methods. */
var relative = path.relative;

/**
 * Find files from the file-system.
 *
 * @param {Object} context - Context object.
 * @param {Object} settings - Configuration.
 * @param {function(Error?)} done - Callback invoked when
 *   done.
 */
function fileSystem(context, settings, done) {
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

  ignore.loadPatterns(function () {
    var files = context.files;
    var injected = Boolean(files.length);
    var globs = settings.globs;

    /* Use injected files. */
    if (injected) {
      files = files.filter(function (file) {
        var filePath = file.filePath();
        var ignored = ignore.shouldIgnore(filePath);

        if (ignored && skip) {
          return false;
        }

        file.quiet = true;
        file.directory = relative(settings.cwd, file.directory);
        file.history = [file.filePath()];
        file.namespace('unified-engine').given = true;

        if (ignored) {
          file.fail('Cannot process given file: it’s ignored');
        }

        return true;
      });
    }

    if (!globs.length) {
      context.files = files;
      return done();
    }

    finder.find(globs, function (err, found) {
      context.files = files.concat(found);

      /* If `out` wasn’t set, detect it based on
       * whether one file was given. */
      if (settings.out == null) {
        settings.out = !injected && finder.oneFileMode;
      }

      done(err);
    });
  });
}
