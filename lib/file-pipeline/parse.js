/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline:parse
 * @fileoverview Parse a file into an AST.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var debug = require('debug')('unified-engine:file-pipeline:parse');

/**
 * Fill a file with an ast.
 *
 * @param {Object} context - Context.
 * @param {File} file - File.
 */
function parse(context, file) {
    if (file.hasFailed()) {
        return;
    }

    if (context.treeIn) {
        debug('Not parsing already parsed document');

        /* Add the preferred extension to ensure the file,
         * when compiled, is correctly recognized. */
        file.move({
            'extension': context.extensions[0] || null
        });

        try {
            context.tree = JSON.parse(file.toString());
        } catch (err) {
            file.fail(err);
        }

        file.contents = '';

        return;
    }

    debug('Parsing `%s` with `%j`', file.filePath(), context.settings);

    context.tree = context.processor.parse(file, context.settings);

    debug('Parsed document');
}

/*
 * Expose.
 */

module.exports = parse;
