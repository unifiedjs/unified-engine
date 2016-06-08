/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-set-pipeline:stdin
 * @fileoverview Read from `streamIn`.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var debug = require('debug')('unified-engine:file-set-pipeline:stdin');
var toVFile = require('to-vfile');
var concat = require('concat-stream');

/**
 * Read from `streamIn`.
 *
 * @param {Object} context - Context object.
 * @param {Object} settings - Configuration.
 * @param {function(Error?)} done - Completion handler.
 */
function stdin(context, settings, done) {
    var streamIn = settings.streamIn;
    var err;

    debug('Checking `streamIn`');

    if (context.files.length) {
        debug('Ignoring `streamIn`');

        if (settings.filePath) {
            err = new Error(
                'Do not pass both `--file-path` and real files.\n' +
                'Did you mean to pass stdin instead of files?'
            );
        }

        done(err);

        return;
    }

    if (streamIn.isTTY) {
        debug('Cannot read from `tty` stream');
        done(new Error('No input'));

        return;
    }

    /*
     * Constants.
     */

    debug('Reading from `streamIn`');

    streamIn.pipe(concat({
        'encoding': 'string'
    }, function (value) {
        var file = toVFile(settings.filePath || '');
        var space = file.namespace('unified-engine');

        debug('Read from `streamIn`');

        file.contents = value;
        file.quiet = true;
        space.given = true;

        context.files = [file];

        done();
    }));
}

module.exports = stdin;
