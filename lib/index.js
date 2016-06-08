/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Engine.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fileSetPipeline = require('./file-set-pipeline');

/**
 * Run the file set pipeline once.
 *
 * `callback` is invoked with a fatal error,
 * or with a status code (`0` on success, `1` on failure).
 *
 * @param {Object} options - Configuration.
 * @param {Function} callback - Callback.
 */
function run(options, callback) {
    var settings = {};
    var tree;
    var detectConfig;
    var hasConfig;
    var detectIgnore;
    var hasIgnore;
    var files;

    if (!callback) {
        throw new Error('Missing `callback`');
    }

    /**
     * Invoke `callback`.
     *
     * @param {Error?} err - Fatal error.
     * @param {Object?} context - Context object.
     */
    function next(err, context) {
        var failed = ((context || {}).files || []).some(function (file) {
            return file.messages.some(function (message) {
                return message.fatal === true ||
                    (message.fatal === false && settings.frail);
            });
        });

        if (err) {
            callback(err);
        } else {
            callback(null, failed ? 1 : 0, context);
        }
    }

    if (!options || !options.processor) {
        return next(new Error('Missing `processor`'));
    }

    /*
     * Processor.
     */

    settings.processor = options.processor;

    /*
     * Path to run as.
     */

    settings.cwd = options.cwd || process.cwd();

    /*
     * Input.
     */

    settings.globs = options.globs || [];
    settings.extensions = (options.extensions || [])
        .map(function (extension) {
            if (extension.charAt(0) === '.') {
                extension = extension.slice(1);
            }
            return extension;
        });

    settings.filePath = options.filePath || null;
    settings.streamIn = options.streamIn || process.stdin;

    /*
     * Output.
     */

    settings.streamOut = options.streamOut || process.stdout;
    settings.streamError = options.streamError || process.stderr;
    settings.output = options.output || false;
    settings.out = options.out;

    if (settings.output && settings.out) {
        return next(new Error('Cannot accept both `output` and `out`'));
    }

    /*
     * Process phase management.
     */

    tree = options.tree || false;

    settings.treeIn = options.treeIn;
    settings.treeOut = options.treeOut;

    if (settings.treeIn == null) {
        settings.treeIn = tree;
    }

    if (settings.treeOut == null) {
        settings.treeOut = tree;
    }

    /*
     * Configuration.
     */

    detectConfig = options.detectConfig;
    hasConfig = Boolean(options.rcName || options.packageField);

    if (detectConfig && !hasConfig) {
        return next(new Error(
            'Missing `rcName` or `packageField` with `detectConfig`'
        ));
    }

    settings.detectConfig = detectConfig == null ? hasConfig : detectConfig;
    settings.rcName = options.rcName || null;
    settings.rcPath = options.rcPath || null;
    settings.packageField = options.packageField || null;
    settings.settings = options.settings || {};

    /*
     * Ignore.
     */

    detectIgnore = options.detectIgnore;
    hasIgnore = Boolean(options.ignoreName);

    settings.detectIgnore = detectIgnore == null ? hasIgnore : detectIgnore;
    settings.ignoreName = options.ignoreName || null;
    settings.ignorePath = options.ignorePath || null;

    if (detectIgnore && !hasIgnore) {
        return next(new Error('Missing `ignoreName` with `detectIgnore`'));
    }

    /*
     * Plug-ins.
     */

    settings.pluginPrefix = options.pluginPrefix || null;
    settings.plugins = options.plugins || {};
    settings.injectedPlugins = options.injectedPlugins || [];

    /*
     * Reporting.
     */

    settings.color = options.color || false;
    settings.silent = options.silent || false;
    settings.quiet = options.quiet || false;
    settings.frail = options.frail || false;

    /*
     * Files.
     */

    files = options.files || [];

    if (files.length) {
        if (hasIgnore) {
            return next(new Error(
                'Cannot accept both `files` and `ignoreName`'
            ));
        }

        if (settings.globs.length) {
            return next(new Error(
                'Cannot accept both `files` and `globs`'
            ));
        }

        if (options.streamIn) {
            return next(new Error(
                'Cannot accept both `files` and `streamIn`'
            ));
        }
    }

    /*
     * Process.
     */

    fileSetPipeline.run({
        'files': files
    }, settings, next);
}

/*
 * Expose.
 */

module.exports = run;
