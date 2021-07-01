import createDebug from 'debug'
import statistics from 'vfile-statistics'
import isEmpty from 'is-empty'

const debug = createDebug('unified-engine:file-pipeline:configure')

// Collect configuration for a file based on the context.
export function configure(context, file, fileSet, next) {
  if (statistics(file).fatal) {
    return next()
  }

  context.configuration.load(file.path, handleConfiguration)

  function handleConfiguration(error, configuration) {
    let index = -1

    if (error) {
      return next(error)
    }

    // Store configuration on the context object.
    debug('Using settings `%j`', configuration.settings)
    context.processor.data('settings', configuration.settings)

    debug('Using `%d` plugins', configuration.plugins.length)

    while (++index < configuration.plugins.length) {
      const plugin = configuration.plugins[index][0]
      let options = configuration.plugins[index][1]

      if (options === false) {
        continue
      }

      // Allow for default arguments in es2020.
      if (
        options === null ||
        (typeof options === 'object' && isEmpty(options))
      ) {
        options = undefined
      }

      debug(
        'Using plugin `%s`, with options `%j`',
        plugin.displayName || plugin.name || 'function',
        options
      )

      try {
        context.processor.use(plugin, options, fileSet)
        /* Should not happen anymore! */
        /* c8 ignore next 3 */
      } catch (error_) {
        return next(error_)
      }
    }

    next()
  }
}
