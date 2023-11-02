/**
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef {import('../configuration.js').Configuration} Configuration
 * @typedef {import('../index.js').Settings} Settings
 * @typedef {import('../index.js').VFileReporter} VFileReporter
 */

import {pathToFileURL} from 'node:url'
import {loadPlugin} from 'load-plugin'
import {reporter} from 'vfile-reporter'

/**
 * @typedef Context
 *   Context.
 * @property {Array<VFile>} files
 *   Files.
 * @property {Configuration | undefined} [configuration]
 *   Configuration.
 */

/**
 * @param {Context} context
 *   Context.
 * @param {Settings} settings
 *   Settings.
 * @returns {Promise<undefined>}
 *   Nothing.
 */
export async function log(context, settings) {
  /** @type {VFileReporter} */
  let func = reporter

  if (typeof settings.reporter === 'string') {
    try {
      // Assume a valid reporter.
      const result = /** @type {VFileReporter} */ (
        await loadPlugin(settings.reporter, {
          from: pathToFileURL(settings.cwd) + '/',
          prefix: 'vfile-reporter'
        })
      )

      func = result
    } catch (error) {
      throw new Error('Cannot find reporter `' + settings.reporter + '`', {
        cause: error
      })
    }
  } else if (settings.reporter) {
    func = settings.reporter
  }

  let diagnostics = await func(
    context.files.filter(function (file) {
      return file.data.unifiedEngineGiven && !file.data.unifiedEngineIgnored
    }),
    {
      ...settings.reporterOptions,
      color: settings.color,
      quiet: settings.quiet,
      silent: settings.silent,
      verbose: settings.verbose
    }
  )

  if (diagnostics) {
    if (diagnostics.charAt(diagnostics.length - 1) !== '\n') {
      diagnostics += '\n'
    }

    return new Promise(function (resolve) {
      settings.streamError.write(diagnostics, () => resolve(undefined))
    })
  }
}
