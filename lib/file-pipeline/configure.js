/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:file-pipeline:configure
 * @fileoverview Configure a file.
 */

'use strict';

/* Dependencies. */
var debug = require('debug')('unified-engine:file-pipeline:configure');
var fnName = require('fn-name');

/* Expose. */
module.exports = configure;

/**
 * Collect configuration for a file based on the context.
 *
 * @param {Object} context - Context.
 * @param {File} file - File.
 * @param {FileSet} fileSet - Set.
 * @param {function(Error?)} next - Callback invoked when
 *   done.
 */
function configure(context, file, fileSet, next) {
  var config = context.configuration;
  var processor = context.processor;

  if (file.hasFailed()) {
    return next();
  }

  config.getConfiguration(file.filePath(), function (err, options) {
    var allPlugins = context.injectedPlugins.concat();
    var plugins;
    var option;
    var plugin;
    var length;
    var index;
    var filePath;
    var name;

    if (err) {
      return next(err);
    }

    plugins = Object.keys(options.plugins);
    length = plugins.length;
    index = -1;

    debug('Using plug-ins `%j`', plugins);

    while (++index < length) {
      filePath = plugins[index];
      option = options.plugins[filePath];

      if (option === false) {
        debug('Ignoring plug-in `%s`', filePath);
      } else {
        debug('Loading plug-in `%s`', filePath);

        try {
          plugin = require(filePath);
        } catch (err) {
          debug('Could not load plug-in `%s`: %s', filePath, err);
          return next(err);
        }

        if (typeof plugin !== 'function') {
          return next(new Error(
            'Loading `' + filePath + '` should give ' +
            'a function, not `' + plugin + '`'
          ));
        }

        allPlugins.push([plugin, option]);
      }
    }

    length = allPlugins.length;
    index = -1;

    debug('Using `%d` plugins', length);

    while (++index < length) {
      plugin = allPlugins[index];

      if (typeof plugin === 'function') {
        option = null;
      } else {
        option = plugin[1];
        plugin = plugin[0];
      }

      /* Allow for default arguments in es2020. */
      if (
        option === null ||
        (typeof option === 'object' && !Object.keys(option).length)
      ) {
        option = undefined;
      }

      name = fnName(plugin);
      debug('Applying options `%j` to `%s`', option, name);

      try {
        processor.use(plugin, option, fileSet);
      } catch (err) {
        debug('Could not apply plug-in `%s`: %s', name, err);
        return next(err);
      }
    }

    /* Store some configuration on the context object. */
    debug('Setting output `%s`', options.output);
    debug('Using settings `%j`', options.settings);

    context.output = options.output;
    context.settings = options.settings;

    next();
  });
}
