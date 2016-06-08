/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline
 * @fileoverview Process a file.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var ware = require('ware');
var read = require('./read');
var configure = require('./configure');
var parse = require('./parse');
var transform = require('./transform');
var queue = require('./queue');
var stringify = require('./stringify');
var copy = require('./copy');
var stdout = require('./stdout');
var fileSystem = require('./file-system');

/**
 * Factory to run a pipe. Wraps a pipe to trigger an
 * error on the `file` in `context`, but still call
 * `next`.
 *
 * @param {Ware} pipe - Middelware.
 * @return {function(Object, Function)} - Runner.
 */
function runFactory(pipe) {
    /**
     * Run `context` through a bound pipe.
     * Always invokes `next` (without error).
     *
     * @param {Object} context - Context.
     * @param {File} file - File.
     * @param {FileSet} fileSet - Set.
     * @param {function(Error?)} done - Completion handler.
     */
    function run(context, file, fileSet, done) {
        pipe.run(context, file, fileSet, function (err) {
            if (err) {
                file.quiet = true;
                file.fail(err);
            }

            done();
        });
    }

    return run;
}

/*
 * Middleware, this ensures each of the four pipes
 * always runs (so even if the read pipe fails),
 * queue, write, and log trigger.
 */

var pipe = ware()
    .use(runFactory(
        ware()
        .use(read)
        .use(configure)
        .use(parse)
        .use(transform)
    ))
    .use(runFactory(ware().use(queue)))
    .use(runFactory(
        ware()
        .use(stringify)
        .use(copy)
        .use(stdout)
        .use(fileSystem)
    ));

/*
 * Expose.
 */

module.exports = pipe;
