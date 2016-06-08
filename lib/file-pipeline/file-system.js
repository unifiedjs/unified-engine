/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline:file-system
 * @fileoverview Write a file to the file system.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var debug = require('debug')('unified-engine:file-pipeline:file-system');

/*
 * Methods.
 */

var writeFile = fs.writeFile;
var resolve = path.resolve;

/**
 * Write a virtual file to the file-system.
 * Ignored when `output` is not given.
 *
 * @param {Object} context - Context.
 * @param {File} file - File.
 * @param {FileSet} fileSet - Set.
 * @param {function(Error?)} done - Completion handler.
 */
function fileSystem(context, file, fileSet, done) {
    var destinationPath;

    if (!context.output) {
        debug('Ignoring writing to file-system');
    } else if (!file.namespace('unified-engine').given) {
        debug('Ignoring programmatically added file');
    } else {
        destinationPath = file.filePath();

        if (!destinationPath) {
            debug('Ignoring file without output location');
        } else {
            destinationPath = resolve(context.cwd, destinationPath)
            debug('Writing document to `%s`', destinationPath);

            file.stored = true;

            writeFile(destinationPath, file.toString(), done);

            return;
        }
    }

    done();
}

/*
 * Expose.
 */

module.exports = fileSystem;
