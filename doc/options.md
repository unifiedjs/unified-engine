# Options

[`unified-engine`][api] can be configured extensively by engine authors.

## Contents

*   [`options.processor`](#optionsprocessor)
*   [`options.cwd`](#optionscwd)
*   [`options.files`](#optionsfiles)
*   [`options.extensions`](#optionsextensions)
*   [`options.streamIn`](#optionsstreamin)
*   [`options.filePath`](#optionsfilepath)
*   [`options.streamOut`](#optionsstreamout)
*   [`options.streamError`](#optionsstreamerror)
*   [`options.out`](#optionsout)
*   [`options.output`](#optionsoutput)
*   [`options.alwaysStringify`](#optionsalwaysstringify)
*   [`options.tree`](#optionstree)
*   [`options.treeIn`](#optionstreein)
*   [`options.treeOut`](#optionstreeout)
*   [`options.inspect`](#optionsinspect)
*   [`options.rcName`](#optionsrcname)
*   [`options.packageField`](#optionspackagefield)
*   [`options.detectConfig`](#optionsdetectconfig)
*   [`options.rcPath`](#optionsrcpath)
*   [`options.settings`](#optionssettings)
*   [`options.ignoreName`](#optionsignorename)
*   [`options.detectIgnore`](#optionsdetectignore)
*   [`options.ignorePath`](#optionsignorepath)
*   [`options.ignorePathResolveFrom`](#optionsignorepathresolvefrom)
*   [`options.ignorePatterns`](#optionsignorepatterns)
*   [`options.ignoreUnconfigured`](#optionsignoreunconfigured)
*   [`options.silentlyIgnore`](#optionssilentlyignore)
*   [`options.plugins`](#optionsplugins)
*   [`options.pluginPrefix`](#optionspluginprefix)
*   [`options.defaultConfig`](#optionsdefaultconfig)
*   [`options.configTransform`](#optionsconfigtransform)
*   [`options.reporter`](#optionsreporter)
*   [`options.reporterOptions`](#optionsreporteroptions)
*   [`options.color`](#optionscolor)
*   [`options.silent`](#optionssilent)
*   [`options.quiet`](#optionsquiet)
*   [`options.frail`](#optionsfrail)

## `options.processor`

unified processor to transform files.

*   Type: [`Processor`][processor]

###### Example

The following example reformats **stdin**(4) using [remark][], writes the report
to **stderr**(4), and formatted document to **stdout**(4).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine({processor: remark}, done)

function done(error) {
  if (error) throw error
}
```

## `options.cwd`

Directory to search files in, load plugins from, and more.

*   Type: `string` or `URL`
*   Default: [`process.cwd()`][cwd]

###### Example

The following example reformats `readme.md`.  The `doc` directory is used to
process from.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    cwd: new URL('doc/', import.meta.url),
    files: ['readme.md'],
    output: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.files`

Paths or [globs][glob], or [vfile][]s to files and directories to process.
Fileglobs (for example, `*.md`) can be given to add all matching files.
Directories and globs to directories can be given alongside
[`extensions`][extensions] to search directories for files matching an extension
(for example, `dir` to add `dir/readme.txt` and `dir/sub/history.text` if
`extensions` is `['txt', 'text']`).
This searching will not include `node_modules` or hidden directories (those
starting with a dot, `.`, like `.git`).

*   Type: `Array<string>`
*   Default: `[]`

###### Example

The following example processes `README` and all files with an `md` extension in
`doc`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark,
    files: ['README', 'doc'],
    extensions: ['md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.extensions`

If [`files`][files] matches directories, those directories are searched for
files whose extension matches the given `extensions`.

In addition, if [`treeIn`][tree-in] is turned on and [`output`][output] is
`true` or points to a directory, generated files are given the first extension.

*   Type: `Array<string>`
*   Default: `[]`

###### Example

The following example reformats all files with `md`, `markdown`, and `mkd`
extensions in the current directory.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark,
    files: ['.'],
    extensions: ['md', 'mkd', 'markdown'],
    output: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.streamIn`

Stream to read from if no files are found or given.
If `streamIn` is the only possible source of input but it’s a [TTY][], an error
is thrown.

*   Type: [`ReadableStream`][readable]
*   Default: [`process.stdin`][stdin]

###### Example

The following example uses [`remark-lint`][remark-lint] to lint an incoming
stream.

```js
import {PassThrough} from 'stream'
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

const streamIn = new PassThrough()

engine(
  {
    processor: remark(),
    plugins: [remarkPresetLintRecommended],
    streamIn: streamIn,
    out: false
  },
  done
)

streamIn.write('doc')

setTimeout(delayed, 100)

function delayed() {
  streamIn.end('ument')
}

function done(error) {
  if (error) throw error
}
```

Yields:

```txt
<stdin>
  1:1  warning  Missing newline character at end of file  final-newline  remark-lint

⚠ 1 warning
```

## `options.filePath`

File path to process the given file on [`streamIn`][stream-in] as, if any.

*   Type: `string` (optional)

###### Example

The following example shows the same as before, with a `filePath` added, which
is shown in the report:

```js
import {PassThrough} from 'stream'
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

const streamIn = new PassThrough()

engine(
  {
    processor: remark(),
    plugins: [remarkPresetLintRecommended],
    filePath: '~/alpha/bravo/charlie.md',
    streamIn: streamIn,
    out: false
  },
  done
)

streamIn.write('doc')

setTimeout(() => {
  streamIn.end('ument')
}, 100)

function done(error) {
  if (error) throw error
}
```

Yields:

```txt
~/alpha/bravo/charlie.md
  1:1  warning  Missing newline character at end of file  final-newline  remark-lint

⚠ 1 warning
```

## `options.streamOut`

Stream to write processed files to.
This behavior is suppressed if:

*   [`out`][out] is `false`
*   [`output`][output] is not `false`
*   multiple files are processed
*   a fatal error occurred while processing a file

<!-- Info: -->

*   Type: [`WritableStream`][writable]
*   Default: [`process.stdout`][stdout]

###### Example

The following example reads `readme.md` and writes the serialized document to
`readme-two.md`.
Note that this can also be achieved by passing `output: 'readme-two.md'` instead
of `streamOut`.

```js
import fs from 'node:fs'
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    streamOut: fs.createWriteStream('readme-two.md')
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.streamError`

Stream to write the [report][reporter] (if any) to.

*   Type: [`WritableStream`][writable]
*   Default: [`process.stderr`][stderr]

###### Example

The following example uses [`remark-lint`][remark-lint] to lint `readme.md` and
writes the report to `report.txt`.

```js
import fs from 'node:fs'
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: [remarkPresetLintRecommended],
    out: false,
    streamErr: fs.createWriteStream('report.txt')
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.out`

Whether to write the processed file to [`streamOut`][stream-out].
The default behavior is to only write under some conditions, as specified in
the section on [`streamOut`][stream-out], but if `out` is `false` nothing will
be written to `streamOut`.

*   Type: `boolean`
*   Default: depends (see above)

###### Example

The following example uses [`remark-lint`][remark-lint] to lint `readme.md`,
writes the report, and ignores the serialized document.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkPresetLintRecommended from 'remark-preset-lint-recommended'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: [remarkPresetLintRecommended],
    out: false
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.output`

Whether to write successfully processed files and where to.

*   When `true`, overwrites the given files
*   When `false`, does not write to the file system
*   When pointing to an existing directory, files are written to that directory
    and keep their original basenames
*   When the parent directory of the given path exists and one file is
    processed, the file is written to the given path
*   Otherwise, a fatal error is thrown

Note that if [`treeIn`][tree-in] is turned on, generated files get the first
defined [`extensions`][extensions].
If [`treeOut`][tree-out] is turned on, generated files receive the `'json'`
extension.
If [`inspect`][inspect] is turned on, generated files receive the `'txt'`
extension.

<!-- Info: -->

*   Type: `string` or `boolean`
*   Default: `false`

###### Example

The following example writes all files in `src/` with an `md` extension,
compiled, to `dest/`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['src/'],
    extensions: ['md'],
    output: 'dest/'
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.alwaysStringify`

Whether to always serialize successful documents.
By default, documents are serialized when it’s detected that a file is to be
written to **stdout**(4) or the file system.
If files are handled and possibly written somewhere later, set this option to
`true`.

*   Type: `boolean`
*   Default: `false`

## `options.tree`

Whether to treat both input and output as a syntax tree.
If given, specifies the default value for both [`treeIn`][tree-in] and
[`treeOut`][tree-out].

*   Type: `boolean`, optional
*   Default: `false`

###### Example

The following example reads `tree.json`, then [`remark-unlink`][remark-unlink]
transforms the syntax tree, and the transformed tree is written to
**stdout**(4).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkUnlink from 'remark-unlink'

engine(
  {
    processor: remark(),
    plugins: [remarkUnlink],
    files: ['tree.json'],
    tree: true
  },
  done
)

function done(error) {
  if (error) throw error
}
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

Treat input as a [`JSON.stringify`][json-stringify]d syntax tree, thus skipping
the [parsing phase][unified-description] and passing the syntax tree right
through to transformers.

If [`extensions`][extensions] are given, sets the extension of processed files
to the first one.

*   Type: `boolean`, optional
*   Default: [`options.tree`][tree]

###### Example

The following example reads `tree.json`, then [`remark-unlink`][remark-unlink]
transforms the syntax tree, the tree is serialized, and the resulting document
is written to **stdout**(4).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkUnlink from 'remark-unlink'

engine(
  {
    processor: remark(),
    plugins: [remarkUnlink],
    files: ['tree.json'],
    treeIn: true
  },
  done
)

function done(error) {
  if (error) throw error
}
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

Skip the [compilation phase][unified-description] and serialize the transformed
syntax tree to JSON.

Sets the extension of processed files to `json`, if possible.

*   Type: `boolean`, optional
*   Default: [`options.tree`][tree]

###### Example

The following example shows a module which reads and parses `doc.md`, then
[`remark-unlink`][remark-unlink] transforms the syntax tree, and the tree is
written to **stdout**(4).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkUnlink from 'remark-unlink'

engine(
  {
    processor: remark(),
    plugins: [remarkUnlink],
    files: ['doc.md'],
    treeOut: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

Where `doc.md` looks as follows:

```markdown
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

## `options.inspect`

Skip the [compilation phase][unified-description] and output a syntax tree
formatted with [`unist-util-inspect`][unist-util-inspect].

Sets the extension of processed files to `txt` if possible.

Uses ANSI color sequences in the formatted syntax tree if `color` is turned on.

*   Type: `boolean`, optional
*   Default: `false`

###### Example

The following example shows a module which reads and parses `doc.md`, then
[`remark-unlink`][remark-unlink] transforms the syntax tree, the tree is
formatted with [`unist-util-inspect`][unist-util-inspect], and finally written
to **stdout**(4).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'
import remarkUnlink from 'remark-unlink'

engine(
  {
    processor: remark(),
    plugins: [remarkUnlink],
    files: ['doc.md'],
    inspect: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

Where `doc.md` looks as follows:

```markdown
[foo](https://example.com)
```

Yields:

```txt
root[1] (1:1-2:1, 0-27)
└─ paragraph[1] (1:1-1:27, 0-26)
   └─ text: "foo" (1:2-1:5, 1-4)
```

## `options.rcName`

File path of [configuration][configure] file to load.
If given and [`detectConfig`][detect-config] is not `false`, then:

*   `$rcName` and `$rcName.json` are loaded and parsed as JSON
*   `$rcName.yml` and `$rcName.yaml` are loaded with `yaml`
*   `$rcName.js` are either `require`d or `import`ed
*   `$rcName.cjs` are `require`d
*   `$rcName.mjs` are `import`ed

<!---->

*   Type: `string`, optional

###### Example

The following example processes `readme.md` and allows configuration from
`.remarkrc`, `.remarkrc.json`, `.remarkrc.yml`, `.remarkrc.yaml`,
`.remarkrc.js`, `.remarkrc.cjs`, and `.remarkrc.mjs` files.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    rcName: '.remarkrc',
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.packageField`

Property at which [configuration][configure] can live in `package.json` files.
If given and [`detectConfig`][detect-config] is not `false`, `package.json`
files are loaded and parsed as JSON and their `$packageField` property is used
for configuration.

*   Type: `string`, optional

###### Example

The following example processes `readme.md`, and allows configuration from
`remarkConfig` fields in `package.json` files.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    packageField: 'remarkConfig',
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.detectConfig`

Whether to search for [configuration][configure] files ([`$rcName`][rc-name],
`$rcName.json`, `$rcName.cjs`, `$rcName.mjs`, `$rcName.js`, `$rcName.yaml`,
`$rcName.yml`, and `package.json` with [`$packageField`][package-field]).

*   Type: `boolean`, optional
*   Default: `true` if [`rcName`][rc-name] or [`packageField`][package-field]
    are given

###### Example

The following example processes `readme.md` but does **not** allow configuration
from `.remarkrc` or `package.json` files, as `detectConfig` is `false`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    detectConfig: false,
    rcName: '.remarkrc',
    packageField: 'remarkConfig',
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.rcPath`

File path to a config file to load, regardless of
[`detectConfig`][detect-config] or [`rcName`][rc-name].

If the file’s extension is `yml` or `yaml`, it’s loaded as YAML.
If it’s `js`, it’s either `require`d or `import`ed.
If it’s `cjs`, it’s `require`d.
If it’s `mjs`, it’s `import`ed.
If the file’s basename is `package.json`, the value at
[`packageField`][package-field] is used.
Otherwise, the file is parsed as JSON.

*   Type: `string`, optional

###### Example

The following example processes `readme.md` and loads configuration from
`config.json`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    rcPath: 'config.json',
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.settings`

Configuration for the parser and compiler of the processor.

*   Type: `Object`, optional

###### Example

The following example processes `readme.md` and configures the parser and
compiler with `position: false`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    settings: {position: false}
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.ignoreName`

Name of [ignore file][ignore] to load.
If given and [`detectIgnore`][detect-ignore] is not `false`, `$ignoreName` files
are loaded.

The patterns in found ignore file are resolved based on the file’s directory.
If we had an ignore file `folder/.remarkignore`, with the value: `index.txt`,
and our file system looked as follows:

```txt
folder/.remarkignore
folder/index.txt
index.txt
```

Then `folder/index.txt` would be ignored but `index.txt` would not be.

*   Type: `string`, optional

###### Example

The following example processes files in the current working directory with an
`md` extension, and is configured to ignore file paths from the closest
`.remarkignore` file.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    ignoreName: '.remarkignore'
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.detectIgnore`

Whether to search for [ignore file][ignore]s ([`$ignoreName`][ignore-name]).

*   Type: `boolean`, optional
*   Default: `true` if [`ignoreName`][ignore-name] is given

###### Example

The following example processes files in the current working directory with an
`md` extension but does **not** ignore file paths from the closest
`.remarkignore` file, because `detectIgnore` is `false`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    ignoreName: '.remarkignore',
    detectIgnore: false
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.ignorePath`

File path to [ignore file][ignore] to load, regardless of
[`detectIgnore`][detect-ignore] or [`ignoreName`][ignore-name].

The patterns in the ignore file are resolved based the setting of
`ignorePathResolveFrom`, which when `'dir'` (default) means to resolve from the
ignore file’s directory, or when `'cwd'` means to resolve from the current
working directory.
If we had an ignore file `folder/ignore`, with the value: `index.txt`, and our
file system looked as follows:

```txt
folder/ignore
folder/index.txt
index.txt
```

Then `folder/index.txt` would be ignored but `index.txt` would not be.

*   Type: `string`, optional

###### Example

The following example processes files in the current working directory with an
`md` extension and ignores file paths specified in `.gitignore`.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    ignorePath: '.gitignore'
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.ignorePathResolveFrom`

Enum of either `dir` (default) or `cwd`, which defines whether the patterns
found in the ignore file at [`ignorePath`][ignore-path] are resolved from that
file’s directory or the current working directory.

If we had an ignore file `config/ignore`, with the value: `index.txt`, and our
file system looked as follows:

```txt
config/ignore
folder/index.txt
index.txt
```

Normally, no `index.txt` files would be ignored, but when given
`ignorePathResolveFrom: 'cwd'`, both would be.

*   Type: `string`, optional

###### Example

The following example processes files in the current working directory with an
`md` extension and takes a reusable configuration file from a dependency.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    ignorePath: 'node_modules/my-config/my-ignore',
    ignorePathResolveFrom: 'cwd'
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.ignorePatterns`

Additional patterns to use to ignore files.

*   Type: `Array<string>`, optional

###### Example

The following example processes files in the current working directory with an
`md` extension, except for `readme.md`:

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    ignorePatterns: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.ignoreUnconfigured`

Ignore files that do not have an associated detected configuration file.

*   Type: `boolean`, default: `false`

> 👉 **Note**: this option cannot be turned on in combination with `rcPath` or
> `detectConfig: false`.
> Additionally, at least one of `rcName` or `packageField` must be defined.

###### Example

The following example processes files in the current working directory with an
`md` extension, but only if there is an explicit `.remarkrc` config file near
(upwards) to them:

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['.'],
    extensions: ['md'],
    rcName: '.remarkrc'
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.silentlyIgnore`

Skip given [`files`][files] which are ignored by [ignore files][ignore], instead
of warning about them.

*   Type: `boolean`, default: `false`

## `options.plugins`

Plugins to load and attach with options to the processor for every processed
file.

*   Type: `Object`, `Array`, optional.  Same format as [`plugins` in config
    files][config-plugins]

###### Example

The following example processes `readme.md` and loads the
`remark-preset-lint-recommended` plugin.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: ['remark-preset-lint-recommended']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.pluginPrefix`

Allow plugins to be specified without a prefix.
For example, if a plugin is specified with a name of `foo`, and `pluginPrefix`
is `bar`, both `bar-foo` and `foo` are checked in `node_modules/` directories.

> **Note**: If a prefix is specified, plugins with that prefix are preferred
> over plugins without that prefix.

*   Type: `string`, optional

###### Example

The following example processes `readme.md` and loads the
`preset-lint-recommended` plugin.
Because `pluginPrefix` is given, this resolves to
`remark-preset-lint-recommended` from `node_modules/` if available.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    pluginPrefix: 'remark',
    plugins: ['preset-lint-recommended']
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.defaultConfig`

Optional object with `plugins` and/or `settings` to use if no config file is
supplied by the user.

*   Type: `Object`, optional

###### Example

The following example processes `readme.md`.  If `package.json` exists, that
config is used, otherwise the configuration at `defaultConfig` is used.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    packageField: 'remarkConfig',
    defaultConfig: {settings: {commonmark: true}}
  },
  done
)

function done(error) {
  if (error) throw error
}
```

Where `package.json` contains:

```json
{
  "name": "foo",
  "private": true,
  "remarkConfig": {
    "settings": {
      "footnotes": true
    }
  }
}
```

## `options.configTransform`

Want configuration files in a different format?  Pass a `configTransform`
function.
It will be called with the parsed value from configuration files and the file
path to the found file, and should return a config object (with `plugins` and/or
`settings`).

*   Type: `Function`, optional

###### Example

The following example processes `readme.md` and loads options from `custom`
(from a `package.json`).
`configTransform` is called with those options and transforms it to
configuration `unified-engine` understands.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    packageField: 'custom',
    configTransform: configTransform
  },
  done
)

function done(error) {
  if (error) throw error
}

function configTransform(config) {
  return {settings: (config || {}).options}
}
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

## `options.reporter`

Reporter to use.
Reporters must be loadable from the [`cwd`][root] (such as by installing them
from that directory with npm).
Reporters must be [VFile reporters][reporters].

*   Type: `string` or `function`, optional, default:
    [`import('vfile-reporter').reporter`][vfile-reporter].
    If `string`, the reporter’s prefix (`vfile-reporter-`) can be omitted, so if
    `json` is given, `vfile-reporter-json` is loaded if it exists, and otherwise
    the `json` module itself is loaded (which in this example will not work as
    it’s not a reporter)

###### Note

The [`quiet`][quiet], [`silent`][silent], and [`color`][color] options may not
work with the used reporter.

###### Example

The following example processes all HTML files in the current directory with
rehype, configures the processor with `.rehyperc` files, and prints a report in
[json][], with [reporter options][reporteroptions].

```js
import {engine} from 'unified-engine'
import {rehype} from 'rehype'

engine(
  {
    processor: rehype(),
    files: ['.'],
    extensions: ['html'],
    rcName: '.rehyperc',
    reporter: 'json',
    reporterOptions: {pretty: true}
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.reporterOptions`

Options to pass to the [reporter][].

*   Type: `Object`, optional

###### Note

The [`quiet`][quiet], [`silent`][silent], and [`color`][color] options are
preferred over `reporterOptions` (and passed too).

###### Example

See [`options.reporter`][reporter] for an example.

## `options.color`

Whether to [report][reporter] or [inspect][] with ANSI color sequences.

*   Type: `boolean`, default: `false`

###### Note

This option may not work with the used [reporter][].

###### Example

The following example processes `readme.md` and uses color in the report.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    color: true,
    out: false
  },
  done
)

function done(error) {
  if (error) throw error
}
```

Yields:

```txt
[4m[32mreadme.md[39m[24m: no issues found
```

## `options.silent`

Show only [fatal][] errors in the [report][reporter].

*   Type: `boolean`, default: `false`

###### Note

This option may not work with the used [reporter][].

###### Example

The following example uses [`remark-lint`][remark-lint] to lint `readme.md` but
does not report any warnings or success messages, only fatal errors, if they
occur.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: ['remark-preset-lint-recommended'],
    silent: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.quiet`

Whether to ignore processed files without any messages in the
[report][reporter].
The default behavior is to show a success message.

*   Type: `boolean`, default: [`options.silent`][silent]

###### Note

This option may not work with the used [reporter][].

###### Example

The following example uses [`remark-lint`][remark-lint] to lint `readme.md`.
Nothing is reported if the file processed successfully.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: ['remark-preset-lint-recommended'],
    quiet: true
  },
  done
)

function done(error) {
  if (error) throw error
}
```

## `options.frail`

Count warnings as errors when calculating if the process succeeded.

*   Type: `boolean`, default: `false`

###### Example

The following example uses [`remark-lint`][remark-lint] to lint `readme.md` and
logs the exit code.
Normally, only errors turn the `code` to `1`, but in `frail` mode lint warnings
result in the same.

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

engine(
  {
    processor: remark(),
    files: ['readme.md'],
    plugins: ['remark-preset-lint-recommended'],
    frail: true
  },
  done
)

function done(error, code) {
  process.exit(error ? 1 : code)
}
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

[unified-description]: https://github.com/unifiedjs/unified#description

[vfile]: https://github.com/vfile/vfile

[vfile-reporter]: https://github.com/vfile/vfile-reporter

[json-stringify]: https://developer.mozilla.org/JavaScript/Reference/Global_Objects/JSON/stringify

[fatal]: https://github.com/vfile/vfile#vfilefailreason-position-ruleid

[processor]: https://github.com/unifiedjs/unified#processor

[remark]: https://github.com/remarkjs/remark

[remark-lint]: https://github.com/remarkjs/remark-lint

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

[inspect]: #optionsinspect

[detect-config]: #optionsdetectconfig

[rc-name]: #optionsrcname

[package-field]: #optionspackagefield

[detect-ignore]: #optionsdetectignore

[ignore-name]: #optionsignorename

[ignore-path]: #optionsignorepath

[quiet]: #optionsquiet

[silent]: #optionssilent

[color]: #optionscolor

[files]: #optionsfiles

[root]: #optionscwd

[reporter]: #optionsreporter

[reporteroptions]: #optionsreporteroptions

[config-plugins]: ./configure.md#plugins

[reporters]: https://github.com/vfile/vfile#reporters

[json]: https://github.com/vfile/vfile-reporter-json

[unist-util-inspect]: https://github.com/syntax-tree/unist-util-inspect
