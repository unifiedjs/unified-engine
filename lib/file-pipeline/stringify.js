/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline:stringify
 * @fileoverview Compile an AST into a file.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var debug = require('debug')('unified-engine:file-pipeline:stringify');

/**
 * Stringify an AST.
 *
 * @param {Object} context - Context.
 * @param {File} file - File.
 */
function stringify(context, file) {
    var processor = context.processor;
    var tree = context.tree;
    var settings = context.settings;
    var value;

    if (file.hasFailed()) {
        debug('Not compiling failed document');
        return;
    }

    if (!context.output && !context.out) {
        debug('Not compiling document without output settings');
        return;
    }

    debug('Compiling `%s` with `%j`', file.filePath(), settings);

    if (context.treeOut) {
        /* Add a `json` extension to ensure the file is
         * correctly seen as JSON. */
        file.move({
            'extension': 'json'
        });

        value = JSON.stringify(tree, null, 2);
    } else {
        value = processor.stringify(tree, file, settings);
    }

    /* Ensure valid UNIX file. */
    if (value && value.charAt(value.length - 1) !== '\n') {
        value += '\n'
    }

    file.contents = value;

    debug('Compiled document');
}

/*
 * Expose.
 */

module.exports = stringify;
