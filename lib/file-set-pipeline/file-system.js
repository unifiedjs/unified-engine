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
    ignore: ignore
  });

  ignore.loadPatterns(function () {
    /* Use the files when they were injected,
     * which we now because there are no globs. */
    if (context.files.length) {
      /* Mark as given. */
      context.files.forEach(function (file) {
        file.directory = relative(settings.cwd, file.directory);
        file.history = [file.filePath()];
        file.namespace('unified-engine').given = true;
      });

      done();

      return;
    }

    finder.find(settings.globs, function (err, files) {
      context.files = files;

      /* If `out` wasn’t set, detect it based on
       * whether one file was given. */
      if (settings.out == null) {
        settings.out = finder.oneFileMode;
      }

      done(err);
    });
  });
}
