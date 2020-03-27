// TypeScript Version: 3.0

import {Plugin, Pluggable, PluggableList, Processor, Settings} from 'unified'
import {VFile} from 'vfile'
import {ReadStream, WriteStream} from 'fs'

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
    files?: string[] | VFile[]

    /**
     * If `files` matches directories, include `files` with `extensions`
     */
    extensions?: string[]

    /**
     * Stream to read from if no files are found or given
     *
     * @defaultValue `process.stdin`
     */
    streamIn?: ReadStream

    /**
     * File path to process the given file on `streamIn` as
     */
    filePath?: string

    /**
     * Stream to write processed files to
     *
     * @defaultValue `process.stdout`
     */
    streamOut?: WriteStream

    /**
     * Stream to write the report (if any) to
     *
     * @defaultValue `process.stderr`
     */
    streamError?: WriteStream

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
    pluginsPrefix?: string

    /**
     * Transform config files from a different schema
     */
    configTransform?: (config: unknown) => Options<P>

    /**
     * Reporter to use
     *
     * @defaultValue `require('vfile-reporter')`
     */
    reporter?: VFileReporter<V>

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

  interface FileSet {
    files: VFile[]
    origins: string[]
    expected: number
    actual: number
    pipeline: unknown
    plugins: Plugin[]
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
   * Callback invoked when processing according to options is complete. Invoked with either a fatal error if processing went horribly wrong (probably due to incorrect configuration), or a status code and the processing context.
   */
  interface Callback {
    /**
     * Callback invoked when processing according to options is complete. Invoked with either a fatal error if processing went horribly wrong (probably due to incorrect configuration), or a status code and the processing context.
     *
     * @param error Fatal error
     * @param failed Either 0 if successful, or 1 if unsuccessful. The latter occurs if fatal errors happen when processing individual files, or if frail is set and warnings occur
     * @param context Processing context, containing internally used information and a `files` array with the processed files
     */
    (error: Error | null, failed: 0 | 1, context: CallbackContext): void
  }
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
