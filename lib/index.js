import {PassThrough} from 'stream'
import {statistics} from 'vfile-statistics'
import {fileSetPipeline} from './file-set-pipeline/index.js'

// Run the file set pipeline once.
// `callback` is invoked with a fatal error, or with a status code (`0` on
// success, `1` on failure).
export function engine(options, callback) {
  const settings = {}
  let stdin = new PassThrough()

  try {
    stdin = process.stdin
    // Obscure bug in Node (seen on Windows).
    // See: <https://github.com/nodejs/node/blob/f856234/lib/internal/process/stdio.js#L82>,
    // <https://github.com/AtomLinter/linter-markdown/pull/85>.
    /* c8 ignore next 1 */
  } catch {}

  if (!callback) {
    throw new Error('Missing `callback`')
  }

  if (!options || !options.processor) {
    return next(new Error('Missing `processor`'))
  }

  // Processor.
  settings.processor = options.processor

  // Path to run as.
  settings.cwd = options.cwd || process.cwd()

  // Input.
  settings.files = options.files || []
  settings.extensions = (options.extensions || []).map((ext) =>
    ext.charAt(0) === '.' ? ext : '.' + ext
  )

  settings.filePath = options.filePath || null
  settings.streamIn = options.streamIn || stdin

  // Output.
  settings.streamOut = options.streamOut || process.stdout
  settings.streamError = options.streamError || process.stderr
  settings.alwaysStringify = options.alwaysStringify
  settings.output = options.output
  settings.out = options.out

  // Null overwrites config settings, `undefined` does not.
  if (settings.output === null || settings.output === undefined) {
    settings.output = undefined
  }

  if (settings.output && settings.out) {
    return next(new Error('Cannot accept both `output` and `out`'))
  }

  // Process phase management.
  const tree = options.tree || false

  settings.treeIn = options.treeIn
  settings.treeOut = options.treeOut
  settings.inspect = options.inspect

  if (settings.treeIn === null || settings.treeIn === undefined) {
    settings.treeIn = tree
  }

  if (settings.treeOut === null || settings.treeOut === undefined) {
    settings.treeOut = tree
  }

  // Configuration.
  const detectConfig = options.detectConfig
  const hasConfig = Boolean(options.rcName || options.packageField)

  if (detectConfig && !hasConfig) {
    return next(
      new Error('Missing `rcName` or `packageField` with `detectConfig`')
    )
  }

  settings.detectConfig =
    detectConfig === null || detectConfig === undefined
      ? hasConfig
      : detectConfig
  settings.rcName = options.rcName || null
  settings.rcPath = options.rcPath || null
  settings.packageField = options.packageField || null
  settings.settings = options.settings || {}
  settings.configTransform = options.configTransform
  settings.defaultConfig = options.defaultConfig

  // Ignore.
  const detectIgnore = options.detectIgnore
  const hasIgnore = Boolean(options.ignoreName)

  settings.detectIgnore =
    detectIgnore === null || detectIgnore === undefined
      ? hasIgnore
      : detectIgnore
  settings.ignoreName = options.ignoreName || null
  settings.ignorePath = options.ignorePath || null
  settings.ignorePathResolveFrom = options.ignorePathResolveFrom || 'dir'
  settings.ignorePatterns = options.ignorePatterns || []
  settings.silentlyIgnore = Boolean(options.silentlyIgnore)

  if (detectIgnore && !hasIgnore) {
    return next(new Error('Missing `ignoreName` with `detectIgnore`'))
  }

  // Plugins.
  settings.pluginPrefix = options.pluginPrefix || null
  settings.plugins = options.plugins || {}

  // Reporting.
  settings.reporter = options.reporter || null
  settings.reporterOptions = options.reporterOptions || null
  settings.color = options.color || false
  settings.silent = options.silent || false
  settings.quiet = options.quiet || false
  settings.frail = options.frail || false

  // Process.
  fileSetPipeline.run({files: options.files || []}, settings, next)

  function next(error, context) {
    const stats = statistics((context || {}).files)
    const failed = Boolean(
      settings.frail ? stats.fatal || stats.warn : stats.fatal
    )

    if (error) {
      callback(error)
    } else {
      callback(null, failed ? 1 : 0, context)
    }
  }
}
