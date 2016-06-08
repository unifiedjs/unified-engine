/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:ignore
 * @fileoverview Find ignore files.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var debug = require('debug')('unified-engine:ignore');
var minimatch = require('minimatch');
var findUp = require('vfile-find-up');
var hidden = require('is-hidden');

/*
 * Constants.
 */

var C_BACKSLASH = '\\';
var C_SLASH = '/';
var C_EXCLAMATION = '!';
var CD = './';
var EMPTY = '';

var defaults = [
    '**/node_modules'
];

/*
 * Methods.
 */

var read = fs.readFileSync;
var relative = path.relative;
var resolve = path.resolve;

/**
 * Check if `file` matches `pattern`.
 *
 * @param {string} filePath - File location.
 * @param {string} pattern - Glob pattern.
 * @return {boolean} - Whether `file` matches `pattern`.
 */
function match(filePath, pattern) {
    return minimatch(filePath, pattern) ||
        minimatch(filePath, pattern + '/**');
}

/**
 * Check if a pattern-like line is an applicable pattern.
 *
 * @param {string} value - Line to check.
 * @return {boolean} - Whether `value` is an applicable
 *   pattern.
 */
function applicable(value) {
    var line = value && value.trim();

    return line && line.length && line.charAt(0) !== '#';
}

/**
 * Parse an ignore file.
 *
 * @throws {Error} - Throws when `filePath` is not found.
 * @param {string} filePath - File location.
 * @return {Object} - List of applicable patterns.
 */
function load(filePath) {
    var ignore = [];

    try {
        ignore = read(filePath, 'utf8').split(/\r?\n/).filter(applicable);
    } catch (err) {
        err.message = 'Cannot read ignore file: ' +
            filePath + '\n' + err.message;

        throw err;
    }

    return ignore;
}

/**
 * Find ignore-patterns.
 *
 * @constructor
 * @class {Ignore}
 * @param {Object?} [options] - Configuration.
 */
function Ignore(options) {
    var self = this;
    var ignorePath = options.ignorePath;

    self.cwd = options.cwd;
    self.detectIgnore = options.detectIgnore;
    self.ignoreName = options.ignoreName;
    self.ignorePath = ignorePath;

    if (ignorePath) {
        debug('Using ignore file at `' + ignorePath + '`');

        self.ignoreFile = load(resolve(self.cwd, ignorePath));
    }
}

/**
 * Get patterns belonging to `filePath`.
 *
 * @param {Function} callback - Invoked with an optional
 *   error.
 */
function loadPatterns(callback) {
    var self = this;

    debug('Constructing ignore for `' + self.cwd + '`');

    /**
     * Handle succesful pattern getting.
     *
     * @param {Array.<string>?} [results] - Patterns
     */
    function done(results) {
        self.patterns = (results || []).concat(defaults);
        callback();
    }

    if (self.ignoreFile) {
        done(self.ignoreFile);
        debug('Using `ignoreFile`: %j', self.patterns);
    } else if (!self.detectIgnore) {
        done();
        debug('Not searching for ignore files: %j', self.patterns);
    } else {
        findUp.one([self.ignoreName], self.cwd, function (err, file) {
            var result;

            if (file) {
                try {
                    result = load(file.filePath());
                } catch (err) { /* Empty */ }
            }

            done(result);
            debug('Using ignore patterns: %j', self.patterns);
        });
    }
}

/**
 * Check whether `filePath` should be ignored based on
 * the given `patterns`.
 *
 * @param {string} filePath - File-path to check.
 * @return {boolean} - whether `filePath` should be ignored
 *   based on the given `patterns`.
 */
function shouldIgnore(filePath) {
    var self = this;
    var value = false;
    var normalized = relative(self.cwd, filePath)
        .replace(C_BACKSLASH, C_SLASH)
        .replace(CD, EMPTY);

    /* By default, hidden directories are ignored. */
    if (filePath.split(path.sep).some(hidden)) {
        value = true;
    }

    return this.patterns.reduce(function (ignored, pattern) {
        var negated = pattern.charAt(0) === C_EXCLAMATION;

        if (negated) {
            pattern = pattern.slice(1);
        }

        if (pattern.indexOf(CD) === 0) {
            pattern = pattern.slice(CD.length);
        }

        return match(normalized, pattern) ? !negated : ignored;
    }, value);
}

/*
 * Expose methods.
 */

Ignore.prototype.shouldIgnore = shouldIgnore;
Ignore.prototype.loadPatterns = loadPatterns;

/*
 * Expose.
 */

module.exports = Ignore;
