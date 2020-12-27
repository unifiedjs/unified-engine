// TypeScript Version: 3.0

import {Pluggable, PluggableList, Processor, Settings, Preset} from 'unified'
import {VFile} from 'vfile'

declare namespace unifiedEngine {
  type VFileReporter<T = Settings> = (files: VFile[], options: T) => string

  /**
   * Options for unified engine
   *
   * @typeParam P Unified Processor settings
   * @typeParam V VFile reporter settings
   */
  interface Options<P = Settings, V = Settings> {
    /**
     * Unified processor to transform files
     */
    processor: Processor<P>

    /**
     * Directory to search files in, load plugins from, and more
     *
     * @defaultValue `process.cwd()`
     */
    cwd?: string

    /**
     * Paths or globs to files and directories, or virtual files, to process
     */
    files?: Array<string | VFile>

    /**
     * If `files` matches directories, include `files` with `extensions`
     */
    extensions?: string[]

    /**
     * Stream to read from if no files are found or given
     *
     * @defaultValue `process.stdin`
     */
    streamIn?: NodeJS.ReadableStream

    /**
     * File path to process the given file on `streamIn` as
     */
    filePath?: string

    /**
     * Stream to write processed files to
     *
     * @defaultValue `process.stdout`
     */
    streamOut?: NodeJS.WritableStream

    /**
     * Stream to write the report (if any) to
     *
     * @defaultValue `process.stderr`
     */
    streamError?: NodeJS.WritableStream

    /**
     * Whether to write the processed file to `streamOut`
     */
    out?: boolean

    /**
     * Whether to write successfully processed files, and where to
     *
     * * When `true`, overwrites the given files
     * * When `false`, does not write to the file system
     * * When pointing to an existing directory, files are written to that directory and keep their original basenames
     * * When the parent directory of the given path exists and one file is processed, the file is written to the given path
     *
     * @defaultValue `false`
     */
    output?: boolean | string

    /**
     * Whether to always serialize successfully processed files
     *
     * @defaultValue `false`
     */
    alwaysStringify?: boolean

    /**
     * Whether to treat both input and output as a syntax tree
     *
     * @defaultValue `false`
     */
    tree?: boolean

    /**
     * Whether to treat input as a syntax tree
     *
     * @defaultValue same as `tree`
     */
    treeIn?: boolean

    /**
     * Whether to treat output as a syntax tree
     *
     * @defaultValue same as `tree`
     */
    treeOut?: boolean

    /**
     * Whether to output a formatted syntax tree
     *
     * @defaultValue `false`
     */
    inspect?: boolean

    /**
     * Name of configuration files to load
     */
    rcName?: string

    /**
     * Property at which configuration can be found in `package.json` files
     */
    packageField?: string

    /**
     * Whether to search for configuration files
     *
     * @defaultValue `true` if `rcName` or `packageField` are given
     */
    detectConfig?: boolean

    /**
     * Filepath to a configuration file to load
     */
    rcPath?: string

    /**
     * Configuration for the parser and compiler of the processor
     */
    settings?: P

    /**
     * Name of ignore files to load
     */
    ignoreName?: string

    /**
     * Whether to search for ignore files
     *
     * @defaultValue `true` if `ignoreName` is given
     */
    detectIgnore?: boolean

    /**
     * Filepath to an ignore file to load
     */
    ignorePath?: string

    /**
     * Resolve patterns in `ignorePath` from the current working directory
     * (`'cwd'`) or the ignore file’s directory (`'dir'`, default)
     *
     * @defaultValue `'dir'`
     */
    ignorePathResolveFrom?: 'cwd' | 'dir'

    /**
     * Patterns to ignore in addition to ignore files
     */
    ignorePatterns?: string[]

    /**
     * Skip given files if they are ignored
     *
     * @defaultValue `false`
     */
    silentlyIgnore?: boolean

    /**
     * Plugins to use
     */
    plugins?: Pluggable<[Settings?], P> | PluggableList<P>

    /**
     * Optional prefix to use when searching for plugins
     */
    pluginPrefix?: string

    /**
     * Transform config files from a different schema
     */
    configTransform?: (config: unknown) => Partial<Preset<Settings, P>>

    /**
     * Reporter to use
     *
     * @defaultValue `require('vfile-reporter')`
     */
    reporter?: VFileReporter<V> | string

    /**
     * Config to pass to the used reporter
     */
    reporterOptions?: V

    /**
     * Whether to report with ANSI color sequences
     *
     * @defaultValue `false`
     */
    color?: boolean

    /**
     * Report only fatal errors
     *
     * @defaultValue `false`
     */
    silent?: boolean

    /**
     * Do not report successful files
     *
     * @defaultValue same as `silent`
     */
    quiet?: boolean

    /**
     * Call back with an unsuccessful (`1`) code on warnings as well as errors
     *
     * @defaultValue `false`
     */
    frail?: boolean
  }

  /**
   * Callback for Completer
   */
  type CompleterNext = (error: Error) => void

  /**
   * Function invoked when all files are processed
   *
   * @param fileSet Processed file set
   * @param next If the signature of a completer includes `next`, the function may finish asynchronous, and must invoke `next()`.
   * @returns If a promise is returned, the function is asynchronous, and must be resolved (with nothing) or rejected
   */
  interface Completer {
    /**
     * Plugins specified through various mechanisms are attached to a new processor for each file.
     * If a completer is used multiple times, it is invoked multiple times as well.
     * To prevent completers from attaching multiple times, specify a `pluginId`.
     * This will ensure only one completer per `pluginId` is added.
     */
    pluginId?: string

    (fileSet: FileSet, next?: CompleterNext): Error | Promise<void>
  }

  /**
   * A FileSet is created to process multiple files through unified processors.
   * This set, containing all files, is exposed to plugins as an argument to the attacher.
   */
  interface FileSet {
    /**
     * Access the files in a set
     */
    valueOf(): VFile[]

    /**
     * Add a file to be processed. The given file is processed like other files with a few differences
     * * Ignored when their file path is already added
     * * Never written to the file system or streamOut
     * * Not reported for
     */
    add(file: VFile | string): FileSet

    /**
     * Attach a completer to a middleware pipeline which runs when all files are transformed (before compilation)
     */
    completer(completer: Completer): FileSet
  }

  /**
   * Processing context
   */
  interface CallbackContext {
    /**
     * Processed files
     */
    files: VFile[]

    /**
     * Internally used information
     */
    fileset: FileSet
  }

  /**
   * Callback invoked when processing according to options is complete.
   * Invoked with either a fatal error if processing went horribly wrong (probably due to incorrect configuration),
   * or a status code and the processing context.
   */
  type Callback = (
    error: Error | null,
    failed: 0 | 1,
    context: CallbackContext
  ) => void
}

/**
 * Process files according to options and invoke callback when done
 *
 * @typeParam P Unified Processor settings
 * @typeParam V VFile reporter settings
 */
declare function unifiedEngine<P = Settings, V = Settings>(
  options: unifiedEngine.Options<P, V>,
  callback: unifiedEngine.Callback
): void

export = unifiedEngine
