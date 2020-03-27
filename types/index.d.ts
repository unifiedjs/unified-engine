// TypeScript Version: 3.0

import {Processor, Settings, Pluggable, PluggableList} from 'unified'
import {VFile} from 'vfile'
import {ReadStream, WriteStream} from 'fs'

declare namespace unifiedEngine {
  type VFileReporter<T = Settings> = (files: VFile[], options: T) => string

  interface Options<P = Settings, V = Settings> {
    /**
     * Unified processor to transform files
     */
    processor: Processor<P>

    cwd?: string

    files?: Array<string | VFile>

    extensions?: string[]

    streamIn?: ReadStream

    filePath?: string

    streamOut?: WriteStream

    streamError?: WriteStream

    out?: boolean

    output?: boolean | string

    alwaysStringify?: boolean

    tree?: boolean

    treeIn?: boolean

    treeOut?: boolean

    inspect?: boolean

    rcName?: string

    packageField?: string

    detectConfig?: boolean

    rcPath?: string

    settings?: P

    ignoreName?: string

    detectIgnore?: boolean

    ignorePath?: string

    ignorePatterns?: string[]

    silentlyIgnore?: boolean

    plugins?: Pluggable<[Settings?], P> | PluggableList<P>

    pluginsPrefix?: string

    configTransform?: (config: unknown) => Options<P>

    reporter?: VFileReporter<V>

    reporterOptions?: V

    color?: boolean

    silent?: boolean

    quiet?: boolean

    frail?: boolean
  }
}

/**
 * Process files according to options and invoke callback when done
 */
declare function unifiedEngine<P = Settings, V = Settings>(
  options: unifiedEngine.Options<P, V>
): void

export = unifiedEngine
