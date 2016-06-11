/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:finder
 * @fileoverview Get applicable input files from
 *   the file system to be processed by remark, respecting
 *   ignored paths and applicable extensions.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var debug = require('debug')('unified-engine:finder');
var globby = require('globby');
var magic = require('glob').hasMagic;
var minimatch = require('minimatch');
var toVFile = require('to-vfile');
var findDown = require('vfile-find-down');

/*
 * Methods.
 */

var resolve = path.resolve;
var relative = path.relative;
var stat = fs.statSync;

/*
 * Constants.
 */

var NODE_MODULES = 'node_modules';

/**
 * Check if `filePath` matches some `patterns`.
 *
 * @param {string} filePath - File location.
 * @param {string} patterns - Globs pattern.
 * @return {boolean} - Whether `file` matches `pattern`.
 */
function matches(filePath, patterns) {
    return patterns.some(function (pattern) {
        return minimatch(filePath, pattern) ||
            minimatch(filePath, pattern + '/**');
    });
}

/**
 * Construct a new finder.
 *
 * @constructor
 * @class {Finder}
 * @param {Object} [options={}] - Settings.
 */
function Finder(options) {
    this.settings = options;
}

/**
 * Find files matching `patterns` and the bound settings.
 *
 * @this {Finder}
 * @param {Array.<string>} patterns - Globs and file-paths
 *   to search for.
 * @param {Function} callback - Callback to invoke when
 *   done.
 */
function find(patterns, callback) {
    var self = this;
    var ignore = self.settings.ignore;
    var extensions = self.settings.extensions;
    var cwd = self.settings.cwd;
    var globs = [];
    var given = [];
    var failed = [];

    if (!extensions || !extensions.length) {
        debug('Cannot search for files without `extensions`');
    }

    patterns.forEach(function (pattern) {
        var file;

        if (magic(pattern)) {
            globs.push(pattern);
        } else {
            given.push(resolve(cwd, pattern));

            try {
                stat(resolve(cwd, pattern));
            } catch (err) {
                file = toVFile(pattern);
                file.quiet = true;

                file.fail('No such file or directory');

                failed.push(file);
            }
        }
    });

    /**
     * Test to check if `file` should be included.
     *
     * @param {VFile} file - Virtual file or directory.
     * @return {*} - Results for `vfile-find-down`.
     */
    function test(file) {
        var filePath = file.filePath();
        var extension = file.extension;
        var isGiven = given.indexOf(filePath) !== -1;
        var isFile = stat(filePath).isFile();
        var modules = filePath.split(path.sep).some(function (part) {
            return part.toLowerCase() === NODE_MODULES;
        });

        /*
         * If the file or directory should be ignored,
         * is hidden and not negated, skip it.
         *
         * If it is both ignored and given, trigger a
         * warning.
         */

        if (modules || ignore.shouldIgnore(filePath)) {
            if (isGiven) {
                file.fail('Cannot process specified file: it’s ignored');

                return findDown.SKIP | findDown.INCLUDE;
            }

            /* Never walk into `node_modules`. */
            if (modules) {
                return findDown.SKIP;
            }

            /*
             * Directories are still searched for files,
             * as negation patterns can “unhide” those.
             */

            return false;
        }

        /* Do not include non-files. */
        if (!isFile) {
            return false;
        }

        /*
         * If the file is given, matches a glob, or has
         * a known extension, include it.
         */

        return isGiven ||
            matches(relative(cwd, filePath), globs) ||
            (extension && extensions.indexOf(extension) !== -1);
    }

    globby(patterns, {'cwd': cwd}).then(function (filePaths) {
        filePaths = filePaths.map(function (filePath) {
            return resolve(cwd, filePath);
        });

        findDown.all(test, filePaths, function (err, files) {
            /* Fix `filePath` in relation to `cwd`. */
            files.forEach(function (file) {
                file.directory = relative(cwd, file.directory);
                file.history = [file.filePath()];
            });

            files = failed.concat(files);

            /* Sort alphabetically. */
            files.sort(function (left, right) {
                return left.filePath() > right.filePath();
            });

            /*
             * Mark as given.  This allows outputting files,
             * which can be pretty dangerous, so it’s “hidden”.
             */

            files.forEach(function (file) {
                file.namespace('unified-engine').given = true;
            });

            callback(err, files);
        });
    }, callback);
}

/*
 * Methods.
 */

Finder.prototype.find = find;

/*
 * Expose.
 */

module.exports = Finder;
