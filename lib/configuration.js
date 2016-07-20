/**
 * @author Titus Wormer
 * @copyright 2015-2016 Titus Wormer
 * @license MIT
 * @module unified-engine:configuration
 * @fileoverview Find rc files.
 */

'use strict';

/* Dependencies. */
var fs = require('fs');
var path = require('path');
var debug = require('debug')('unified-engine:configuration');
var home = require('user-home');
var yaml = require('js-yaml');
var resolvePlugin = require('load-plugin').resolve;
var findUp = require('vfile-find-up');

/* Expose. */
module.exports = Configuration;

/* Methods. */
var read = fs.readFileSync;
var exists = fs.existsSync;
var resolve = path.resolve;
var dirname = path.dirname;
var extname = path.extname;
var concat = [].concat;

/* Constants. */
var PACKAGE_NAME = 'package';
var PACKAGE_EXTENSION = 'json';
var PACKAGE_FILENAME = [PACKAGE_NAME, PACKAGE_EXTENSION].join('.');
var SCRIPT_EXTENSION = 'js';
var YAML_EXTENSION = 'yaml';
var PLUGIN_KEY = 'plugins';

/**
 * Merge two configurations, `configuration` into
 * `target`.
 *
 * @param {Object} target - Configuration to merge into.
 * @param {Object} configuration - Configuration to merge
 *   from.
 * @param {string} [source] - Used internally no map
 *   changes to source files, and to ensure the plug-in
 *   key is only escaped at root-level.
 * @return {Object} - `target`.
 */
function merge(target, configuration, resolveConfig, source) {
  var key;
  var value;
  var index;
  var length;
  var result;
  var name;
  var plugin;
  var subvalue;

  /* Walk `configuration`. */
  for (key in configuration) {
    value = configuration[key];
    result = target[key];

    if (key === PLUGIN_KEY && source) {
      if (!result) {
        target[PLUGIN_KEY] = result = {};
      }

      if ('length' in value) {
        index = -1;
        length = value.length;

        while (++index < length) {
          name = value[index];
          plugin = resolvePlugin(name, resolveConfig) || name;

          if (!(plugin in result)) {
            log('Configuring plug-in %s', plugin, {});
            result[plugin] = {};
          }
        }
      } else {
        for (name in value) {
          subvalue = value[name];
          plugin = resolvePlugin(name, resolveConfig) || name;

          if (subvalue === false) {
            result[plugin] = false;
            log('Turning off plug-in %s', plugin);
          } else if (!filled(result[plugin])) {
            result[plugin] = merge({}, subvalue || {}, resolveConfig);
            log('Configuring plug-in %s', plugin, result[plugin]);
          } else if (filled(subvalue)) {
            result[plugin] = merge(result[plugin], subvalue, resolveConfig);
            log('Reconfiguring plug-in %s', plugin, result[plugin]);
          } else {
            log('Not reconfiguring plug-in %s', plugin);
          }
        }
      }
    } else if (value && typeof value === 'object') {
      if ('length' in value) {
        target[key] = concat.apply(value);
        log('Setting', key, target[key]);
      } else if (filled(value)) {
        if (result) {
          target[key] = merge(result, value, resolveConfig);
          log('Merging', key, target[key]);
        } else {
          target[key] = value;
          log('Setting', key, value);
        }
      }
    } else if (value !== undefined) {
      target[key] = value;
      log('Setting', key, target[key]);
    }
  }

  return target;

  /**
   * Log a message about setting a value.
   *
   * @param {string} message - Thing done.
   * @param {string} key - Affected key.
   * @param {*} [value] - Set value, if any.
   */
  function log(message, key, value) {
    if (!source) {
      return;
    }

    if (value) {
      debug(message + ' `%s` to `%j` (from `%s`)', key, value, source);
    } else {
      debug(message + ' `%s` (from `%s`)', key, source);
    }
  }
}

/**
 * Parse a JSON configuration object from a file.
 *
 * @throws {Error} - Throws when `filePath` is not found.
 * @param {string} filePath - File location.
 * @return {Object} - Parsed JSON.
 */
function load(filePath) {
  var configuration = {};
  var extension = extname(filePath).slice(1);
  var doc;

  try {
    if (extension === SCRIPT_EXTENSION) {
      configuration = require(filePath);
    } else {
      doc = read(filePath, 'utf8');

      if (extension === YAML_EXTENSION) {
        configuration = yaml.safeLoad(doc);
      } else {
        configuration = JSON.parse(doc);
      }
    }
  } catch (err) {
    err.message = 'Cannot read configuration file: ' +
      filePath + '\n' + err.message;

    throw err;
  }

  return configuration;
}

/**
 * Get personal configuration object from `~`.
 * Loads `rcName` and `rcName.js`.
 *
 * @param {Object} config - Config to load into.
 * @param {string?} rcName - Name of configuration file.
 * @return {Object} - Parsed JSON.
 */
function loadUserConfiguration(config, rcName, resolveConfig) {
  var configuration = {};

  /**
   * Load one file-path.
   *
   * @param {string} filePath - Location of config file.
   */
  function loadOne(filePath) {
    /* istanbul ignore next - not really testable
     * as this loads files outside this project. */
    if (exists(filePath)) {
      merge(configuration, load(filePath), resolveConfig, filePath);
    }
  }

  /* istanbul ignore next - not really testable. */
  if (home) {
    loadOne(path.join(home, rcName));
    loadOne(path.join(home, [rcName, SCRIPT_EXTENSION].join('.')));
    loadOne(path.join(home, [rcName, YAML_EXTENSION].join('.')));
  }

  return configuration;
}

/**
 * Get a local configuration object, by walking from
 * `directory` upwards and merging all configurations.
 * If no configuration was found by walking upwards, the
 * current user's config (at `~`) is used.
 *
 * @param {Configuration} context - Configuration object to use.
 * @param {string} directory - Location to search.
 * @param {Function} callback - Invoked with `files`.
 */
function getLocalConfiguration(context, directory, resolveConfig, callback) {
  var rcName = context.settings.rcName;
  var packageField = context.settings.packageField;
  var search = [];

  if (rcName) {
    search.push(
      rcName,
      [rcName, SCRIPT_EXTENSION].join('.'),
      [rcName, YAML_EXTENSION].join('.')
    );
    debug('Looking for `%s` configuration files', search);
  }

  if (packageField) {
    search.push(PACKAGE_FILENAME);
    debug('Looking for `%s` fields in `package.json` files', packageField);
  }

  if (!search.length || !context.settings.detectConfig) {
    debug('Not looking for configuration files');
    return callback(null, {});
  }

  findUp.all(search, directory, function (err, files) {
    var configuration = {};
    var index = files && files.length;
    var file;
    var local;
    var found;

    while (index--) {
      file = files[index];

      try {
        local = load(file.filePath());
      } catch (err) {
        return callback(err);
      }

      if (
        file.filename === PACKAGE_NAME &&
        file.extension === PACKAGE_EXTENSION
      ) {
        if (packageField in local) {
          local = local[packageField];
        } else {
          continue;
        }
      }

      found = true;

      debug('Using ' + file.filePath());

      merge(configuration, local, resolveConfig, file.filePath());
    }

    if (!found) {
      debug('Using personal configuration');

      loadUserConfiguration(configuration, rcName, resolveConfig);
    }

    callback(err, configuration);
  });
}

/**
 * Configuration.
 *
 * @constructor
 * @class Configuration
 * @param {Object} settings - Options to be passed in.
 */
function Configuration(settings) {
  var self = this;
  var rcPath = settings.rcPath;
  var rcFile = {};

  self.settings = settings;
  self.cache = {};

  if (rcPath) {
    debug('Using command line configuration `' + rcPath + '`');

    rcFile = load(resolve(settings.cwd, rcPath));
  }

  self.rcFile = rcFile;
}

Configuration.prototype.getConfiguration = getConfiguration;

/**
 * Build a configuration object.
 *
 * @param {string} filePath - File location.
 * @param {Function} callback - Callback invoked with
 *   configuration.
 */
function getConfiguration(filePath, callback) {
  var self = this;
  var cwd = self.settings.cwd;
  var directory = dirname(resolve(cwd, filePath));
  var configuration = self.cache[directory];
  var resolveConfig = {
    cwd: cwd,
    prefix: self.settings.pluginPrefix
  };

  debug('Constructing configuration for `' + filePath + '`');

  /**
   * Handle (possible) local config result.
   *
   * @param {Error?} [err] - Loading error.
   * @param {Object?} [localConfiguration] - Configuration.
   */
  function handleLocalConfiguration(err, localConfiguration) {
    var current = self.cache[directory];
    var config = localConfiguration || {};

    merge(config, self.rcFile, resolveConfig, self.settings.rcPath);

    merge(config, {
      settings: self.settings.settings,
      plugins: self.settings.plugins,
      output: self.settings.output
    }, resolveConfig, 'settings');

    self.cache[directory] = config;

    current.forEach(function (callback) {
      callback(err, config);
    });
  }

  /* List of callbacks. */
  if (configuration && callbacks(configuration)) {
    configuration.push(callback);
    return;
  }

  /* istanbul ignore next - only occurs if many files are
   * checked, which is hard to reproduce. */
  if (configuration) {
    debug('Using configuration from cache');
    return callback(null, configuration);
  }

  self.cache[directory] = [callback];
  getLocalConfiguration(self, directory, resolveConfig, handleLocalConfiguration);
}

/**
 * Check if `value` is an object with keys.
 *
 * @param {*} value - Value to check.
 * @return {boolean} - Whether `value` is an object with keys.
 */
function filled(value) {
  return value && typeof value === 'object' && Object.keys(value).length;
}

/**
 * Check if `value` is a list of callbacks.
 *
 * @param {*} value - Value to check.
 * @return {boolean} - Whether `value` is a list of
 *   callbacks.
 */
function callbacks(value) {
  return value && value.length && typeof value[0] === 'function';
}
