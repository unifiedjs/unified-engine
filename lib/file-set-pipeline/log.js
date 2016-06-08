/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:log
 * @fileoverview Log a file context on successful completion.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var chalk = require('chalk');
var report = require('vfile-reporter');

/**
 * Whether was detected by `finder`.
 *
 * @param {VFile} file - Virtual file.
 * @return {boolean} - Whether given by user.
 */
function given(file) {
    return file.namespace('unified-engine').given;
}

/**
 * Output diagnostics to `streamError`.
 *
 * @param {Object} context - Context.
 * @param {Object} settings - Configuration.
 * @param {function(Error?)} next - Completion handler.
 */
function log(context, settings, next) {
    var diagnostics = report(context.files.filter(given), {
        'quiet': settings.quiet,
        'silent': settings.silent
    });

    if (!settings.color) {
        diagnostics = chalk.stripColor(diagnostics);
    }

    if (diagnostics) {
        settings.streamError.write(diagnostics + '\n', next);
    } else {
        next();
    }
}

/*
 * Expose.
 */

module.exports = log;
