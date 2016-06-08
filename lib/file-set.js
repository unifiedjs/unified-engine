/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-set
 * @fileoverview Collection of virtual files.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var events = require('events');
var inherits = require('util').inherits;
var ware = require('ware');
var toVFile = require('to-vfile');

/**
 * Locked `VFile#move`.
 *
 * @this {VFile}
 * @memberof {VFile}
 * @return {VFile} - Context object.
 */
function locked() {
    return this;
}

/**
 * Utility invoked when a single file has completed it's
 * pipeline, triggering `done` when all files are complete.
 */
function one() {
    var self = this;

    self.actual++;

    if (self.actual >= self.expected) {
        self.emit('done');
    }
}

/**
 * Construct a new file-set.
 *
 * @constructor
 * @class {FileSet}
 */
function FileSet() {
    var self = this;

    self.files = [];
    self.sourcePaths = [];

    self.expected = 0;
    self.actual = 0;

    self.pipeline = ware();

    events.init.call(self);

    self.on('one', one.bind(self));
}

/**
 * Create an array representation of `fileSet`.
 *
 * @this {FileSet}
 * @return {Array.<File>} - Value at the `files` property
 *   in context.
 */
function valueOf() {
    return this.files;
}

/**
 * Attach middleware to the pipeline on `fileSet`.
 *
 * A plug-in (function) can have an `pluginId` property,
 * which is used to ignore duplicate attachment.
 *
 * This pipeline will later be run when when all attached
 * files are after the transforming stage.
 *
 * @this {FileSet}
 * @param {Function} plugin - Middleware.
 * @return {FileSet} - `this`; context object.
 */
function use(plugin) {
    var self = this;
    var pipeline = self.pipeline;
    var duplicate = false;

    if (plugin && plugin.pluginId) {
        duplicate = pipeline.fns.some(function (fn) {
            return fn.pluginId === plugin.pluginId;
        });
    }

    if (!duplicate && pipeline.fns.indexOf(plugin) !== -1) {
        duplicate = true;
    }

    if (!duplicate) {
        pipeline.use(plugin);
    }

    return this;
}

/**
 * Add a file to be processed.
 *
 * Ignores duplicate files (based on the `filePath` at time
 * of addition).
 *
 * Only runs `file-pipeline` on files which have not
 * `failed` before addition.
 *
 * @this {FileSet}
 * @param {File|string} file - Virtual file, or path.
 * @return {FileSet} - `this`; context object.
 */
function add(file) {
    var self = this;
    var space;
    var sourcePath;

    if (typeof file === 'string') {
        file = toVFile(file);
    }

    space = file.namespace('unified-engine');

    /* Prevent files from being added multiple times. */
    sourcePath = space.sourcePath || file.filePath();

    if (self.sourcePaths.indexOf(sourcePath) !== -1) {
        return self;
    }

    space.sourcePath = sourcePath;
    self.sourcePaths.push(sourcePath);

    /* Prevent moving files. */
    if (!space.given) {
        file.move = locked;
    }

    /* Add. */
    self.valueOf().push(file);
    self.expected++;

    /*
     * Force an asynchronous operation.
     * This ensures that files which fall through
     * the file pipeline quicker that expected (e.g.,
     * when already fatally failed) still queue up
     * correctly.
     */

    setImmediate(function () {
        self.emit('add', file);
    });

    return self;
}

/*
 * Events.
 */

inherits(FileSet, events.EventEmitter);

/*
 * Expose methods.
 */

FileSet.prototype.valueOf = valueOf;
FileSet.prototype.use = use;
FileSet.prototype.add = add;

/*
 * Expose.
 */

module.exports = FileSet;
