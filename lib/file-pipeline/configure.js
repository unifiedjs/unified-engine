'use strict'

var debug = require('debug')('unified-engine:file-pipeline:configure')
var stats = require('vfile-statistics')
var empty = require('is-empty')

module.exports = configure

// Collect configuration for a file based on the context.
function configure(context, file, fileSet, next) {
  if (stats(file).fatal) {
    return next()
  }

  context.configuration.load(file.path, handleConfiguration)

  function handleConfiguration(error, configuration) {
    var index = -1
    var plugin
    var options

    if (error) {
      return next(error)
    }

    // Store configuration on the context object.
    debug('Using settings `%j`', configuration.settings)
    context.processor.data('settings', configuration.settings)

    debug('Using `%d` plugins', configuration.plugins.length)

    while (++index < configuration.plugins.length) {
      plugin = configuration.plugins[index][0]
      options = configuration.plugins[index][1]

      if (options === false) {
        continue
      }

      // Allow for default arguments in es2020.
      if (options === null || (typeof options === 'object' && empty(options))) {
        options = undefined
      }

      debug(
        'Using plugin `%s`, with options `%j`',
        plugin.displayName || plugin.name || 'function',
        options
      )

      try {
        context.processor.use(plugin, options, fileSet)
      } catch (error_) {
        /* istanbul ignore next - Should not happen anymore! */
        return next(error_)
      }
    }

    next()
  }
}
