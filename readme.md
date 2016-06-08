# unified-engine [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

<!--lint disable heading-increment no-duplicate-headings-->

> **unified** recently changed its interface.  These changes have
> yet to bubble through to the ecosystem before all examples start
> working.

Engine to process multiple files with [**unified**][unified],
allowing users to [configure][] from the file-system.

## Installation

[npm][npm-install]:

```bash
npm install unified-engine
```

## Usage

The following example processes all files in the current directory
with a markdown extension with [**remark**][remark], allows
[configuration][configure] from `.remarkrc` and `package.json` files,
ignoring files from `.remarkignore` files, and more.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
    'processor': remark,
    'globs': ['.'],
    'extensions': ['md', 'markdown', 'mkd', 'mkdn', 'mkdown'],
    'pluginPrefix': 'remark',
    'rcName': '.remarkrc',
    'packageField': 'remarkConfig',
    'ignoreName': '.remarkignore',
    'color': true
}, function (err) {
    if (err) throw err;
});
```

## Table of Contents

*   [API](#api)

    *   [engine(options, callback)](#engineoptions-callback)

*   [Plug-ins](#plug-ins)

*   [Configuration](#configuration)

*   [Ignoring](#ignoring)

*   [License](#license)

## API

### `engine(options, callback)`

Process files according to `options` and invoke `callback` when done.

###### Parameters

*   `callback` (`Function`) — See [`callback`][callback];

*   `options` (`Object`) — See [`options`][options].

    *   [`processor`][processor] ([`Processor`][unified-processor])
        — Unified processor to transform files.

    *   [`cwd`][cwd] (`string`, default: `process.cwd()`)
        — Directory to search files in, load plug-ins from, and more.

    *   [`globs`][globs] (`Array.<string>`, optional)
        — Paths or globs to files and directories to process.

    *   [`extensions`][extensions] (`Array.<string>`, optional)
        — If `globs` matches directories, include files with `extensions`

    *   [`streamIn`][stream-in] (`ReadableStream`, default: `process.stdin`)
        — Stream to read from if no files are found or given.

    *   [`filePath`][file-path] (`string`, optional)
        — File path to process the given file on `streamIn` as.

    *   [`streamOut`][stream-out] (`WritableStream`, default: `process.stdout`)
        — Stream to write processed files to.

    *   [`streamError`][stream-error] (`WritableStream`, default:
        `process.stderr`)
        — Stream to write the report (if any) to.

    *   [`out`][out] (`boolean`, default: depends)
        — Whether to write the processed file to `streamOut`.

    *   [`output`][output] (`boolean` or `string`, default: `false`)
        — Whether to write successfully processed files, and where to.

    *   [`tree`][tree] (`boolean`, default: `false`)
        — Whether to treat both input and output as a syntax tree.

    *   [`treeIn`][tree-in] (`boolean`, default: `tree`)
        — Whether to treat input as a syntax tree.

    *   [`treeOut`][tree-out] (`boolean`, default: `tree`)
        — Whether to treat output as a syntax tree.

    *   [`rcName`][rc-name] (`string`, optional)
        — Name of configuration files to load.

    *   [`packageField`][package-field] (`string`, optional)
        — Property at which configuration can be found in `package.json`
        files.

    *   [`detectConfig`][detect-config] (`boolean`, default: whether
        `rcName` or `packageField` is given)
        — Whether to search for configuration files.

    *   [`rcPath`][rc-path] (`string`, optional)
        — File-path to a configuration file to load.

    *   [`settings`][settings] (`Object`, optional)
        — Configuration for the parser and compiler of the processor.

    *   [`ignoreName`][ignore-name] (`string`, optional)
        — Name of ignore files to load.

    *   [`detectIgnore`][detect-ignore] (`boolean`, default: whether
        `ignoreName` is given)
        — Whether to search for ignore files.

    *   [`ignorePath`][ignore-path] (`string`, optional)
        — File-path to a ignore file to load.

    *   [`plugins`][plugins] (`Object`, optional)
        — Map of plug-in names and options to use.

    *   [`pluginPrefix`][plugin-prefix] (`string`, optional)
        — When given, optional prefix to use when searching for plug-ins.

    *   [`injectedPlugins`][injected-plugins] (`Array`, optional)
        — List of loaded plug-ins to use.

    *   [`color`][color] (`boolean`, default: `false`)
        — Whether to report with ANSI colour sequences.

    *   [`silent`][silent] (`boolean`, default: `false`)
        — Report only fatal errors.

    *   [`quiet`][quiet] (`boolean`, default: `silent`)
        — Do not report successful files.

    *   [`frail`][frail] (`boolean`, default: `false`)
        — Treat warnings as errors.

    *   [`files`][files] (`Array.<VFile>`, optional)
        — Use the given files instead of searching for files.

#### `function callback(err[, code, context])`

Callback invoked when processing according to `options` is complete.
Invoked with either a fatal error if processing went horribly wrong
(probably due to incorrect configuration), or a status code and the
processing context.

###### Parameters

*   `err` (`Error`) — Fatal error.

*   `code` (`number`) — Either `0`, if successful, or `1`, if
    unsuccessful.  The latter occurs if [fatal][] errors
    happen when processing individual files, or if [`frail`][frail]
    is set and warnings occur.

*   `context` (`Object`) — Processing context, containing internally
    used information and a `files` array with the processed files.

## Plug-ins

[`doc/plug-ins.md`][plug-ins] describes in detail how plug-ins
can add more files to be processed and handle all transformed files.

## Configuration

[`doc/configure.md`][configure] describes in detail how configuration
files work.

## Ignoring

[`doc/ignore.md`][ignore] describes in detail how ignore files work.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/unified-engine.svg

[travis]: https://travis-ci.org/wooorm/unified-engine

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/unified-engine.svg

[codecov]: https://codecov.io/github/wooorm/unified-engine

[npm-install]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[unified]: https://github.com/wooorm/unified

[unified-processor]: https://github.com/wooorm/unified#processor

[remark]: https://github.com/wooorm/remark

[fatal]: https://github.com/wooorm/vfile#vfilefailreason-position-ruleid

[callback]: #function-callbackerr-code-context

[options]: doc/options.md#options

[processor]: doc/options.md#optionsprocessor

[cwd]: doc/options.md#optionscwd

[globs]: doc/options.md#optionsglobs

[extensions]: doc/options.md#optionsextensions

[stream-in]: doc/options.md#optionsstreamin

[file-path]: doc/options.md#optionsfilepath

[stream-out]: doc/options.md#optionsstreamout

[stream-error]: doc/options.md#optionsstreamerror

[out]: doc/options.md#optionsout

[output]: doc/options.md#optionsoutput

[tree]: doc/options.md#optionstree

[tree-in]: doc/options.md#optionstreein

[tree-out]: doc/options.md#optionstreeout

[detect-config]: doc/options.md#optionsdetectconfig

[rc-name]: doc/options.md#optionsrcname

[package-field]: doc/options.md#optionspackagefield

[rc-path]: doc/options.md#optionsrcpath

[settings]: doc/options.md#optionssettings

[detect-ignore]: doc/options.md#optionsdetectignore

[ignore-name]: doc/options.md#optionsignorename

[ignore-path]: doc/options.md#optionsignorepath

[plugin-prefix]: doc/options.md#optionspluginprefix

[plugins]: doc/options.md#optionsplugins

[injected-plugins]: doc/options.md#optionsinjectedplugins

[color]: doc/options.md#optionscolor

[silent]: doc/options.md#optionssilent

[quiet]: doc/options.md#optionsquiet

[frail]: doc/options.md#optionsfrail

[files]: doc/options.md#optionsfiles

[configure]: doc/configure.md

[ignore]: doc/ignore.md

[plug-ins]: doc/plug-ins.md
