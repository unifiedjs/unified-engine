# Options

[**unified-engine**][api] can be configured extensively by engine
authors.

## Table of Contents

*   [options.processor](#optionsprocessor)
*   [options.cwd](#optionscwd)
*   [options.files](#optionsfiles)
*   [options.extensions](#optionsextensions)
*   [options.streamIn](#optionsstreamin)
*   [options.filePath](#optionsfilepath)
*   [options.streamOut](#optionsstreamout)
*   [options.streamError](#optionsstreamerror)
*   [options.out](#optionsout)
*   [options.output](#optionsoutput)
*   [options.alwaysStringify](#optionsalwaysstringify)
*   [options.tree](#optionstree)
*   [options.treeIn](#optionstreein)
*   [options.treeOut](#optionstreeout)
*   [options.rcName](#optionsrcname)
*   [options.packageField](#optionspackagefield)
*   [options.detectConfig](#optionsdetectconfig)
*   [options.rcPath](#optionsrcpath)
*   [options.settings](#optionssettings)
*   [options.ignoreName](#optionsignorename)
*   [options.detectIgnore](#optionsdetectignore)
*   [options.ignorePath](#optionsignorepath)
*   [options.silentlyIgnore](#optionssilentlyignore)
*   [options.plugins](#optionsplugins)
*   [options.pluginPrefix](#optionspluginprefix)
*   [options.configTransform](#optionsconfigtransform)
*   [options.color](#optionscolor)
*   [options.silent](#optionssilent)
*   [options.quiet](#optionsquiet)
*   [options.frail](#optionsfrail)

## `options.processor`

Unified processor to transform files.

*   Type: [`Processor`][processor].

###### Example

The following example reformats **stdin**(4) using [remark][], writes
the report to **stderr**(4), and formatted document to **stdout**(4).

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({processor: remark}, function (err) {
  if (err) throw err;
});
```

## `options.cwd`

Directory to search files in, load plug-ins from, and more.

*   Type: `string`;
*   Default: [`process.cwd()`][cwd].

###### Example

The following example reformats `readme.md`.  The `doc` directory is
used to process from.

```js
var path = require('path');
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  cwd: path.join(process.cwd(), 'doc'),
  files: ['readme.md'],
  output: true
}, function (err) {
  if (err) throw err;
});
```

## `options.files`

Paths or [globs][glob], or [vfile][]s to files and directories to process.
Fileglobs (for example, `*.md`) can be given to add all matching files.
Directories and globs to directories can be given alongside
[`extensions`][extensions] to search directories for files matching an
extension (for example, `dir` to add `dir/readme.txt` and `dir/sub/history.text`
if `extensions` is `['txt', 'text']`).  This searching will not include
`node_modules` or hidden directories (those starting with a dot, `.`, like
`.git`).

*   Type: `Array.<string>`;
*   Default: `[]`.

###### Example

The following example processes `README` and all files with an `md`
extension in `doc`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark,
  files: ['README', 'doc'],
  extensions: ['md']
}, function (err) {
  if (err) throw err;
});
```

## `options.extensions`

If [`files`][files] matches directories, those directories are searched
for files whose extension matches the given `extensions`.

*   Type: `Array.<string>`;
*   Default: `[]`.

###### Example

The following example reformats all files with `md`, `markdown`, and
`mkd` extensions in the current directory.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark,
  files: ['.'],
  extensions: ['md', 'mkd', 'markdown'],
  output: true
}, function (err) {
  if (err) throw err;
});
```

## `options.streamIn`

Stream to read from if no files are found or given.  If `streamIn` is
the only possible source of input but it’s a [TTY][], an error is
thrown.

*   Type: [`ReadableStream`][readable];
*   Default: [`process.stdin`][stdin].

###### Example

The following example [lints][remark-lint] an incoming stream.

```js
var engine = require('unified-engine');
var stream = require('stream').PassThrough();
var remark = require('remark');
var lint = require('remark-lint');

engine({
  processor: remark(),
  plugins: [[lint, {finalNewline: true}]],
  streamIn: stream,
  out: false
}, function (err) {
  if (err) throw err;
});

stream.write('doc');

setTimeout(function () {
  stream.end('ument');
}, 100);
```

Yields:

```txt
<stdin>
  1:1  warning  Missing newline character at end of file  final-newline  remark-lint

⚠ 1 warning
```

## `options.filePath`

File path to process the given file on [`streamIn`][stream-in] as, if any.

*   Type: `string` (optional).

###### Example

The following example shows the same as before, with a `filePath`
added, which is seen in the report:

```js
var engine = require('unified-engine');
var stream = require('stream').PassThrough();
var remark = require('remark');
var lint = require('remark-lint');

engine({
  processor: remark(),
  plugins: [[lint, {finalNewline: true}]],
  filePath: '~/alpha/bravo/charlie.md',
  streamIn: stream,
  out: false
}, function (err) {
  if (err) throw err;
});

stream.write('doc');

setTimeout(function () {
  stream.end('ument');
}, 100);
```

Yields:

```txt
~/alpha/bravo/charlie.md
  1:1  warning  Missing newline character at end of file  final-newline  remark-lint

⚠ 1 warning
```

## `options.streamOut`

Stream to write processed files to.  This behaviour is suppressed if:

*   [`out`][out] is `false`;
*   [`output`][output] is not `false`;
*   multiple files are processed;
*   a fatal error occurred while processing a file.

<!-- Info: -->

*   Type: [`WritableStream`][writable];
*   Default: [`process.stdout`][stdout].

###### Example

The following example reads `readme.md` and writes the compiled document
to `readme-two.md`.  Note that this can also be achieved by passing
`output: 'readme-two.md'` instead of `streamOut`.

```js
var fs = require('fs');
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  streamOut: fs.createWriteStream('readme-two.md')
}, function (err) {
  if (err) throw err;
});
```

## `options.streamError`

Stream to write the [report][vfile-reporter] (if any) to.

*   Type: [`WritableStream`][writable];
*   Default: [`process.stderr`][stderr].

###### Example

The following example [lints][remark-lint] `readme.md` and writes the
report to `report.txt`.

```js
var fs = require('fs');
var engine = require('unified-engine');
var remark = require('remark');
var lint = require('remark-lint');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: [[lint, {finalNewline: true}]],
  out: false,
  streamErr: fs.createWriteStream('report.txt')
}, function (err) {
  if (err) throw err;
});
```

## `options.out`

Whether to write the processed file to [`streamOut`][stream-out].  The
default behaviour is to only write under some conditions, as specified
in the section on `streamOut`, but if `out` is `false` nothing will be
written to `streamOut`.

*   Type: `boolean`;
*   Default: depends (see above).

###### Example

The following example [lints][remark-lint] `readme.md`, writes the report,
and ignores the compiled document.

```js
var engine = require('unified-engine');
var remark = require('remark');
var lint = require('remark-lint');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: [lint],
  out: false
}, function (err) {
  if (err) throw err;
});
```

## `options.output`

Whether to write successfully processed files, and where to.  This can
be set from configuration files.

*   When `true`, overwrites the given files;
*   When `false`, does not write to the file-system;
*   When pointing to an existing directory, files are written
    to that directory and keep their original basenames;
*   When the parent directory of the given path exists and one
    file is processed, the file is written to the given path;
*   Otherwise, a fatal error is thrown.

<!-- Info: -->

*   Type: `string` or `boolean`;
*   Default: `false`.

###### Example

The following example writes all files in `source/` with an `md`
extension, compiled, to `destination/`.

```js
var engine = require('unified-engine');
var remark = require('remark');
var lint = require('remark-lint');

engine({
  processor: remark(),
  files: ['source/'],
  extensions: ['md'],
  output: 'destination/'
}, function (err) {
  if (err) throw err;
});
```

## `options.alwaysStringify`

Whether to always stringify successful documents.  By default, documents are
stringified when it’s detected that a file is to be written to **stdout**(4)
or the file system.  If files are handled and possibly written somewhere later,
set this option to `true`.

*   Type: `boolean`;
*   Default: `false`.

## `options.tree`

Whether to treat both input and output as a syntax tree.  If given,
specifies the default value for both [`treeIn`][tree-in] and
[`treeOut`][tree-out].

*   Type: `boolean`, optional;
*   Default: `false`.

###### Example

The following example reads `tree.json`, then
[**remark-unlink**][remark-unlink] transforms the syntax tree, and the
transformed tree is written to **stdout**(4).

```js
var engine = require('unified-engine');
var remark = require('remark');
var unlink = require('remark-unlink');

engine({
  processor: remark(),
  plugins: [unlink],
  files: ['tree.json'],
  tree: true
}, function (err) {
  if (err) throw err;
});
```

Where `tree.json` looks as follows:

```json
{
  "type": "paragraph",
  "children": [{
    "type": "link",
    "url": "https://example.com",
    "children": [{
      "type": "text",
      "value": "foo"
    }]
  }]
}
```

Yields:

```json
{
  "type": "paragraph",
  "children": [{
    "type": "text",
    "value": "foo"
  }]
}
```

## `options.treeIn`

Treat input as a [`JSON.stringify`][json-stringify]d syntax tree, thus
skipping the [parsing phase][unified-description] and passing the syntax
tree right through to transformers.

If [`extensions`][extensions] are given, sets the extension of processed
files to the first.

*   Type: `boolean`, optional;
*   Default: [`options.tree`][tree].

###### Example

The following example reads `tree.json`, then
[**remark-unlink**][remark-unlink] transforms the syntax tree, the tree
is compiled, and the resulting document is written to **stdout**(4).

```js
var engine = require('unified-engine');
var remark = require('remark');
var unlink = require('remark-unlink');

engine({
  processor: remark(),
  plugins: [unlink],
  files: ['tree.json'],
  treeIn: true
}, function (err) {
  if (err) throw err;
});
```

Where `tree.json` looks as follows:

```json
{
  "type": "paragraph",
  "children": [{
    "type": "link",
    "url": "https://example.com",
    "children": [{
      "type": "text",
      "value": "foo"
    }]
  }]
}
```

Yields:

```json
foo
```

## `options.treeOut`

Skip the [compilation phase][unified-description] and compile the
transformed syntax tree to JSON.

Sets the extension of processed files to `json`.

*   Type: `boolean`, optional;
*   Default: [`options.tree`][tree].

###### Example

The following example shows a script which reads and parses `doc.md`,
then [**remark-unlink**][remark-unlink] transforms the syntax tree, and
the tree is written to **stdout**(4).

```js
var engine = require('unified-engine');
var remark = require('remark');
var unlink = require('remark-unlink');

engine({
  processor: remark(),
  plugins: [unlink],
  files: ['doc.md'],
  treeOut: true
}, function (err) {
  if (err) throw err;
});
```

Where `doc.md` looks as follows:

```md
[foo](https://example.com)
```

Yields:

```json
{
  "type": "paragraph",
  "children": [{
    "type": "text",
    "value": "foo"
  }]
}
```

## `options.rcName`

Name of [configuration][configure] file to load.  If given and
[`detectConfig`][detect-config] is not `false`, `$rcName` files
are loaded and parsed as JSON, `$rcName.js` are `require`d, and
`$rcName.yml` and `$rcName.yaml` are loaded with `js-yaml` (`safeLoad`).

*   Type: `string`, optional.

###### Example

The following example processes `readme.md`, and allows configuration
from `.remarkrc`, `.remarkrc.js`, and `.remarkrc.yaml` files.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  rcName: '.remarkrc',
  files: ['readme.md']
}, function (err) {
  if (err) throw err;
});
```

## `options.packageField`

Property at which [configuration][configure] can live in `package.json`
files.  If given and [`detectConfig`][detect-config] is not `false`,
`package.json` files are loaded and parsed as JSON and their
`$packageField` property is used for configuration.

*   Type: `string`, optional.

###### Example

The following example processes `readme.md`, and allows configuration
from `remarkConfig` fields in `package.json` files.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  packageField: 'remarkConfig',
  files: ['readme.md']
}, function (err) {
  if (err) throw err;
});
```

## `options.detectConfig`

Whether to search for [configuration][configure] files
([`$rcName`][rc-name], `$rcName.js`, `$rcName.yaml`, and `package.json`
with [`$packageField`][package-field]).

*   Type: `boolean`, optional;
*   Default: `true` if [`rcName`][rc-name] or [`packageField`][package-field]
    are given.

###### Example

The following example processes `readme.md` but does **not** allow configuration
from `.remarkrc` or `package.json` files, as `detectConfig` is `false`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  detectConfig: false,
  rcName: '.remarkrc',
  packageField: 'remarkConfig',
  files: ['readme.md']
}, function (err) {
  if (err) throw err;
});
```

## `options.rcPath`

File-path to a config file to load, regardless of
[`detectConfig`][detect-config] or [`rcName`][rc-name].

If the file’s extension is `yml` or `yaml`, it’s loaded as YAML.  If the
file’s extension is `js`, it’s `require`d.  If the file’s basename is
`package.json`, the property at [`packageField`][package-field] is used.
Otherwise, the file is parsed as JSON.

*   Type: `string`, optional.

###### Example

The following example processes `readme.md` and loads configuration
from `config.json`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  rcPath: 'config.json',
  files: ['readme.md']
}, function (err) {
  if (err) throw err;
});
```

## `options.settings`

Configuration for the parser and the compiler of the processor.

*   Type: `Object`, optional.

###### Example

The following example processes `readme.md` and configures the parser
and compiler with `position: false`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  settings: {position: false}
}, function (err) {
  if (err) throw err;
});
```

## `options.ignoreName`

Name of [ignore file][ignore] to load.  If given and
[`detectIgnore`][detect-ignore] is not `false`, `$ignoreName` files are
loaded.

*   Type: `string`, optional.

###### Example

The following example processes files in the current working directory
with an `md` extension, and is configured to ignore file paths from the
closest `.remarkignore` file.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['.'],
  extensions: ['md'],
  ignoreName: '.remarkignore'
}, function (err) {
  if (err) throw err;
});
```

## `options.detectIgnore`

Whether to search for [ignore file][ignore] ([`$ignoreName`][ignore-name]).

*   Type: `boolean`, optional;
*   Default: `true` if [`ignoreName`][ignore-name] is given.

###### Example

The following example processes files in the current working directory
with an `md` extension but does **not** ignore file paths from the
closest `.remarkignore` file, because `detectIgnore` is `false`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['.'],
  extensions: ['md'],
  ignoreName: '.remarkignore',
  detectIgnore: false
}, function (err) {
  if (err) throw err;
});
```

## `options.ignorePath`

File-path to [ignore file][ignore] to load, regardless of
[`detectIgnore`][detect-ignore] or [`ignoreName`][ignore-name].

*   Type: `string`, optional.

###### Example

The following example processes files in the current working directory
with an `md` extension and ignores file paths specified in `.gitignore`.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['.'],
  extensions: ['md'],
  ignorePath: '.gitignore'
}, function (err) {
  if (err) throw err;
});
```

## `options.silentlyIgnore`

Skip given [`files`][files] which are ignored by [ignore files][ignore],
instead of warning about them.

*   Type: `boolean`, default: `false`.

## `options.plugins`

Plug-ins to load by their name and attach with options to the processor
for every processed file.

*   Type: `Object`, `Array`, optional.  Same format as
    [`plugins` in config files][config-plugins].

###### Example

The following example processes `readme.md` and loads the `remark-lint`
plug-in.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: ['remark-lint']
}, function (err) {
  if (err) throw err;
});
```

## `options.pluginPrefix`

Allow plug-ins to be specified without a prefix.  For example,
if a plug-in is specified with a name of `foo`, and `pluginPrefix`
is `bar`, both `bar-foo` and `foo` are checked in `node_modules/`
directories.

> **Note:** If a prefix is specified, plug-ins with that prefix are
> preferred over plug-ins without that prefix.

*   Type: `string`, optional.

###### Example

The following example processes `readme.md` and loads the `lint`
plug-in.  Because `pluginPrefix` is given, this resolved to `remark-lint`
from `node_modules/` if available.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  pluginPrefix: 'remark',
  plugins: ['lint']
}, function (err) {
  if (err) throw err;
});
```

## `options.configTransform`

Want configuration files in a different format?  Pass a `configTransform`
function.  It will be invoked with the parsed value from configuration
files and should return a config object (with `plugins` and/or `settings`).

*   Type: `Function`, optional.

###### Example

The following example processes `readme.md` and loads options from
`custom` (from a `package.json`).  `configTransform` is invoked with
those options and transforms it to configuration **unified-engine**
understands.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  packageField: 'custom',
  configTransform: function (config) {
    return {settings: (config || {}).options};
  }
}, function (err) {
  if (err) throw err;
});
```

Where `package.json` contains:

```json
{
  "name": "foo",
  "private": true,
  "custom": {
    "options": {
      "position": false
    }
  }
}
```

## `options.color`

Whether to [report][vfile-reporter] with ANSI colour sequences.

*   Type: `boolean`, default: `false`.

###### Example

The following example processes `readme.md` and uses colour in the
report.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  color: true,
  out: false
}, function (err) {
  if (err) throw err;
});
```

Yields:

```txt
[4m[32mreadme.md[39m[24m: no issues found
```

## `options.silent`

Show only [fatal][] errors in the [report][vfile-reporter].

*   Type: `boolean`, default: `false`.

###### Example

The following example [lints][remark-lint] `readme.md` but does not
report any warnings or success messages, only fatal errors, if they
occur.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: {lint: null},
  silent: true
}, function (err) {
  if (err) throw err;
});
```

## `options.quiet`

Whether to ignore processed files without any messages in the
[report][vfile-reporter].  The default behaviour is to show a
success message.

*   Type: `boolean`, default: [`options.silent`][silent].

###### Example

The following example [lints][remark-lint] `readme.md`.  Nothing is
reported if the file processed successfully.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: {lint: null},
  quiet: true
}, function (err) {
  if (err) throw err;
});
```

## `options.frail`

Count warnings as errors when calculating if the process succeeded.

*   Type: `boolean`, default: `false`.

###### Example

The following example [lints][remark-lint] `readme.md` and logs the exit
code.  Normally, only errors turn the `code` to `1`, but in `frail` mode
lint warnings result in the same.

```js
var engine = require('unified-engine');
var remark = require('remark');

engine({
  processor: remark(),
  files: ['readme.md'],
  plugins: {lint: null},
  frail: true
}, function (err, code) {
  process.exit(err ? 1 : code);
});
```

<!-- Definitions -->

[cwd]: https://nodejs.org/api/process.html#process_process_cwd

[glob]: https://github.com/isaacs/node-glob#glob-primer

[stdin]: https://nodejs.org/api/process.html#process_process_stdin

[stderr]: https://nodejs.org/api/process.html#process_process_stderr

[stdout]: https://nodejs.org/api/process.html#process_process_stdout

[readable]: https://nodejs.org/api/stream.html#stream_class_stream_readable_1

[writable]: https://nodejs.org/api/stream.html#stream_class_stream_writable_1

[tty]: https://nodejs.org/api/tty.html

[unified-description]: https://github.com/wooorm/unified#description

[vfile]: https://github.com/wooorm/vfile

[vfile-reporter]: https://github.com/wooorm/vfile-reporter

[json-stringify]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/JSON/stringify

[fatal]: https://github.com/wooorm/vfile#vfilefailreason-position-ruleid

[processor]: https://github.com/wooorm/unified#processor

[remark]: https://github.com/wooorm/remark

[remark-lint]: https://github.com/wooorm/remark-lint

[remark-unlink]: https://github.com/eush77/remark-unlink

[configure]: ./configure.md

[ignore]: ./ignore.md

[api]: ../readme.md#api

[extensions]: #optionsextensions

[stream-in]: #optionsstreamin

[stream-out]: #optionsstreamout

[out]: #optionsout

[output]: #optionsoutput

[tree]: #optionstree

[tree-in]: #optionstreein

[tree-out]: #optionstreeout

[detect-config]: #optionsdetectconfig

[rc-name]: #optionsrcname

[package-field]: #optionspackagefield

[detect-ignore]: #optionsdetectignore

[ignore-name]: #optionsignorename

[silent]: #optionssilent

[files]: #optionsfiles

[config-plugins]: ./configure.md#plugins
