# unified-engine

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[unified][]** engine to process multiple files, lettings users [configure][]
from the file system.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`engine(options, callback)`](#engineoptions-callback)
*   [Plugins](#plugins)
*   [Configuration](#configuration)
*   [Ignoring](#ignoring)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is the engine.
It’s what you use underneath when you use [`remark-cli`][remark-cli] or a
language server.
Compared to unified, this deals with multiple files, often from the file
system, and with configuration files and ignore files.

## When should I use this?

You typically use something that wraps this, such as:

*   [`unified-args`][args]
    — create CLIs
*   [`unified-engine-gulp`][gulp]
    — create Gulp plugins
*   [`unified-language-server`][language-server]
    — create language servers

You can use this to make such things.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ or 16.0+), install with [npm][]:

```sh
npm install unified-engine
```

## Use

The following example processes all files in the current directory with a
markdown extension with **[remark][]**, allows [configuration][configure]
from `.remarkrc` and `package.json` files, ignoring files from `.remarkignore`
files, and more.

```js
/**
 * @typedef {import('unified-engine').Callback} Callback
 */

import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark,
    files: ['.'],
    extensions: ['md', 'markdown', 'mkd', 'mkdn', 'mkdown'],
    pluginPrefix: 'remark',
    rcName: '.remarkrc',
    packageField: 'remarkConfig',
    ignoreName: '.remarkignore',
    color: true
  },
  done
)

/** @type {Callback} */
function done(error) {
  if (error) throw error
}
```

## API

This package exports the identifier `engine`.
There is no default export.

### `engine(options, callback)`

Process files according to `options` and call [`callback`][callback] when
done.

###### [`options`][options]

*   [`processor`][processor] ([`Processor`][unified-processor])
    — unified processor to transform files
*   [`cwd`][cwd] (`string` or `URL`, default: `process.cwd()`)
    — directory to search files in, load plugins from, and more
*   [`files`][files] (`Array<string|URL|VFile>`, optional)
    — paths or globs to files and directories, virtual files, or URLs, to
    process
*   [`extensions`][extensions] (`Array<string>`, optional)
    — if `files` matches directories, include files with `extensions`
*   [`streamIn`][stream-in] (`ReadableStream`, default: `process.stdin`)
    — stream to read from if no files are found or given
*   [`filePath`][file-path] (`string`, optional)
    — file path to process the given file on `streamIn` as
*   [`streamOut`][stream-out] (`WritableStream`, default: `process.stdout`)
    — stream to write processed files to
*   [`streamError`][stream-error] (`WritableStream`, default: `process.stderr`)
    — stream to write the report (if any) to
*   [`out`][out] (`boolean`, default: depends)
    — whether to write the processed file to `streamOut`
*   [`output`][output] (`boolean` or `string`, default: `false`)
    — whether to write successfully processed files, and where to
*   [`alwaysStringify`][always-stringify] (`boolean`, default: `false`)
    — whether to always serialize successfully processed files
*   [`tree`][tree] (`boolean`, default: `false`)
    — whether to treat both input and output as a syntax tree
*   [`treeIn`][tree-in] (`boolean`, default: `tree`)
    — whether to treat input as a syntax tree
*   [`treeOut`][tree-out] (`boolean`, default: `tree`)
    — whether to treat output as a syntax tree
*   [`inspect`][inspect] (`boolean`, default: `false`)
    — whether to output a formatted syntax tree
*   [`rcName`][rc-name] (`string`, optional)
    — name of configuration files to load
*   [`packageField`][package-field] (`string`, optional)
    — property at which configuration can be found in `package.json` files
*   [`detectConfig`][detect-config] (`boolean`, default: whether `rcName` or
    `packageField` is given)
    — whether to search for configuration files
*   [`rcPath`][rc-path] (`string`, optional)
    — filepath to a configuration file to load
*   [`settings`][settings] (`Object`, optional)
    — configuration for the parser and compiler of the processor
*   [`ignoreName`][ignore-name] (`string`, optional)
    — name of ignore files to load
*   [`detectIgnore`][detect-ignore] (`boolean`, default: whether `ignoreName`
    is given)
    — whether to search for ignore files
*   [`ignorePath`][ignore-path] (`string`, optional)
    — filepath to an ignore file to load
*   [`ignorePathResolveFrom`][ignore-path-resolve-from] (`'dir'` or `'cwd'`,
    default: `'dir'`)
    — resolve patterns in `ignorePath` from the current working directory or the
    file’s directory
*   [`ignorePatterns`][ignore-patterns] (`Array<string>`, optional)
    — patterns to ignore in addition to ignore files, if any
*   [`ignoreUnconfigured`][ignore-unconfigured] (`boolean`, default: `false`)
    — ignore files that do not have an associated detected configuration file
*   [`silentlyIgnore`][silently-ignore] (`boolean`, default: `false`)
    — skip given files if they are ignored
*   [`plugins`][options-plugins] (`Array|Object`, optional)
    — plugins to use
*   [`pluginPrefix`][plugin-prefix] (`string`, optional)
    — optional prefix to use when searching for plugins
*   [`configTransform`][config-transform] (`Function`, optional)
    — transform config files from a different schema
*   [`reporter`][reporter] (`string` or `function`, default:
    `import {reporter} from 'vfile-reporter'`)
    — reporter to use
*   [`reporterOptions`][reporteroptions] (`Object?`, optional)
    — config to pass to the used reporter
*   [`color`][color] (`boolean`, default: `false`)
    — whether to report with ANSI color sequences
*   [`silent`][silent] (`boolean`, default: `false`)
    — report only fatal errors
*   [`quiet`][quiet] (`boolean`, default: `silent`)
    — do not report successful files
*   [`frail`][frail] (`boolean`, default: `false`)
    — call back with an unsuccessful (`1`) code on warnings as well as errors

#### `function callback(error[, code, context])`

Called when processing is complete, either with a fatal error if processing
went horribly wrong (probably due to incorrect configuration on your part as a
developer), or a status code and the processing context.

###### Parameters

*   `error` (`Error`) — fatal error
*   `code` (`number`) — either `0` if successful, or `1` if unsuccessful,
    the latter occurs if [fatal][] errors happen when processing individual
    files, or if [`frail`][frail] is set and warnings occur
*   `context` (`Object`) — processing context, containing internally used
    information and a `files` array with the processed files

## Plugins

[`doc/plugins.md`][plugins] describes in detail how plugins can add more files
to be processed and handle all transformed files.

## Configuration

[`doc/configure.md`][configure] describes in detail how configuration files
work.

## Ignoring

[`doc/ignore.md`][ignore] describes in detail how ignore files work.

## Types

This package is fully typed with [TypeScript][].
It additionally exports the following types:

*   `VFileReporterOptions` — models options passed to vfile reporters
*   `VFileReporter` — models the signature accepted as a vfile reporter
*   `FileSet` — models what is passed to plugins as a second parameter
*   `Completer` — models file set plugins
*   `ResolveFrom` — models the enum allowed for `options.ignorePathResolveFrom`
*   `ConfigTransform` — models the signature of `options.configTransform`
*   `Preset` — models a preset, like `Preset` from `unified` but accepts
    strings
*   `Options` — models configuration
*   `Context` — models the third parameter to `callback`
*   `Callback` — models the signature of `callback`

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ or 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Security

`unified-engine` loads and evaluates configuration files, plugins, and presets
from the file system (often from `node_modules/`).
That means code that is on your file system runs.
Make sure you trust the workspace where you run `unified-engine` and be careful
with packages from npm and changes made by contributors.

## Contribute

See [`contributing.md`][contributing] in [`unifiedjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/unifiedjs/unified-engine/workflows/main/badge.svg

[build]: https://github.com/unifiedjs/unified-engine/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/unifiedjs/unified-engine.svg

[coverage]: https://codecov.io/github/unifiedjs/unified-engine

[downloads-badge]: https://img.shields.io/npm/dm/unified-engine.svg

[downloads]: https://www.npmjs.com/package/unified-engine

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/unifiedjs/unified/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/unifiedjs/.github

[contributing]: https://github.com/unifiedjs/.github/blob/main/contributing.md

[support]: https://github.com/unifiedjs/.github/blob/main/support.md

[coc]: https://github.com/unifiedjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[unified-processor]: https://github.com/unifiedjs/unified#processor

[remark]: https://github.com/remarkjs/remark

[fatal]: https://github.com/vfile/vfile#vfilefailreason-position-ruleid

[callback]: #function-callbackerror-code-context

[options]: doc/options.md#options

[processor]: doc/options.md#optionsprocessor

[cwd]: doc/options.md#optionscwd

[extensions]: doc/options.md#optionsextensions

[stream-in]: doc/options.md#optionsstreamin

[file-path]: doc/options.md#optionsfilepath

[stream-out]: doc/options.md#optionsstreamout

[stream-error]: doc/options.md#optionsstreamerror

[out]: doc/options.md#optionsout

[output]: doc/options.md#optionsoutput

[always-stringify]: doc/options.md#optionsalwaysstringify

[tree]: doc/options.md#optionstree

[tree-in]: doc/options.md#optionstreein

[tree-out]: doc/options.md#optionstreeout

[inspect]: doc/options.md#optionsinspect

[detect-config]: doc/options.md#optionsdetectconfig

[rc-name]: doc/options.md#optionsrcname

[package-field]: doc/options.md#optionspackagefield

[rc-path]: doc/options.md#optionsrcpath

[settings]: doc/options.md#optionssettings

[detect-ignore]: doc/options.md#optionsdetectignore

[ignore-name]: doc/options.md#optionsignorename

[ignore-path]: doc/options.md#optionsignorepath

[ignore-path-resolve-from]: doc/options.md#optionsignorepathresolvefrom

[ignore-patterns]: doc/options.md#optionsignorepatterns

[ignore-unconfigured]: doc/options.md#optionsignoreunconfigured

[silently-ignore]: doc/options.md#optionssilentlyignore

[plugin-prefix]: doc/options.md#optionspluginprefix

[config-transform]: doc/options.md#optionsconfigtransform

[options-plugins]: doc/options.md#optionsplugins

[reporter]: doc/options.md#optionsreporter

[reporteroptions]: doc/options.md#optionsreporteroptions

[color]: doc/options.md#optionscolor

[silent]: doc/options.md#optionssilent

[quiet]: doc/options.md#optionsquiet

[frail]: doc/options.md#optionsfrail

[files]: doc/options.md#optionsfiles

[configure]: doc/configure.md

[ignore]: doc/ignore.md

[plugins]: doc/plugins.md

[gulp]: https://github.com/unifiedjs/unified-engine-gulp

[language-server]: https://github.com/unifiedjs/unified-language-server

[args]: https://github.com/unifiedjs/unified-args

[remark-cli]: https://github.com/remarkjs/remark/tree/main/packages/remark-cli#readme
