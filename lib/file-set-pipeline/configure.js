/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-set-pipeline:configure
 * @fileoverview Configure a collection of files.
 */

'use strict';

/* Dependencies. */
var Configuration = require('../configuration');

/* Expose. */
module.exports = configure;

/**
 * Configure.
 *
 * @param {Object} context - Context object.
 * @param {Object} settings - Configuration.
 */
function configure(context, settings) {
  context.configuration = new Configuration({
    detectConfig: settings.detectConfig,
    rcName: settings.rcName,
    rcPath: settings.rcPath,
    packageField: settings.packageField,
    settings: settings.settings,
    plugins: settings.plugins,
    pluginPrefix: settings.pluginPrefix,
    presetPrefix: settings.presetPrefix,
    output: settings.output,
    cwd: settings.cwd
  });
}
