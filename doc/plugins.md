# Plugins

Normally, **unified** plugins receive upon attaching two arguments:
`processor` (the [`Processor`][unified-processor] it’s attached to) and
`options` (an `Object` users can provide to configure the plugin).

If a plugin is attached by **unified-engine**, a third argument is
given: [`fileSet`][file-set].

###### Example

The following example processes `readme.md` and uses a plugin that adds a
“completer” and another file (`history.md`).

```js
var engine = require('unified-engine')
var remark = require('remark')

// Ensure the completer runs once per file-set.
completer.pluginId = 'some-plugin-id'

engine(
  {
    processor: remark(),
    injectedPlugins: [plugin],
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}

function plugin(processor, options, set) {
  set.use(completer)
  set.add('history.md')
}

function completer(set) {
  console.log('done:', set.valueOf().map(path))
}

function path(file) {
  return file.path
}
```

Yields:

```txt
done: [ 'readme.md', 'history.md' ]
readme.md: no issues found
```

Note that `history.md` is not reported: only files given by the user
are reported (or written).

## Table of Contents

*   [FileSet](#fileset)
    *   [fileSet.valueOf()](#filesetvalueof)
    *   [fileSet.add(file|filePath)](#filesetaddfilefilepath)
    *   [fileSet.use(completer)](#filesetusecompleter)

## `FileSet`

Internally, a `fileSet` is created to process multiple files through
**unified** processors.  This set, containing all files, is exposed
to plugins as an argument to the attacher.

### `fileSet.valueOf()`

Access the files in a set.  Returns a list of [`VFile`][vfile]s being
processed.

### `fileSet.add(file|filePath)`

Add a file to be processed.  The given file is processed like
other files with a few differences.  The added files are:

*   Ignored when their file-path is already added
*   Never written to the file-system or [`streamOut`][stream-out]
*   Not reported for

Returns self.

###### Parameters

*   `filePath` (`string`) — Path to virtual file
*   `file` ([`VFile`][vfile]) — Virtual file

### `fileSet.use(completer)`

Attach a [`completer`][completer] to a middleware pipeline which runs
when all files are transformed (before compilation).  Returns self.

#### `function completer(fileSet[, next])`

Function invoked when all files are processed.

If an error occurs (either because it’s thrown, returned, rejected, or
passed to [`next`][next]), no further completers run and all files fail.

###### Parameters

*   `fileSet` ([**FileSet**][file-set])
*   `next` ([`Function`][next], optional)

###### Returns

*   `Error`
*   `Promise` — If a promise is returned, the function is asynchronous,
    and **must** be resolved (with nothing) or rejected (with an `Error`)

###### Properties

*   `pluginId` (`string`) — Plugins specified through various mechanisms are
    attached to a new [`processor`][unified-processor] for each file.  If a
    `completer` is `use`d multiple times, it is invoked multiple times as well.
    To ensure completers don’t get re-attached, specify a `pluginId`.  This
    will ensure only one completer per `pluginId` is added.

##### `function next([error])`

If the signature of a completer includes `next` (second argument),
the function **may** finish asynchronous, and **must** invoke
`next()`.

###### Parameters

*   `error` (`Error`, optional) — Fatal error

<!-- Definitions -->

[vfile]: https://github.com/vfile/vfile

[unified-processor]: https://github.com/unifiedjs/unified#processor

[completer]: #function-completerfileset-next

[next]: #function-nexterror

[file-set]: #fileset

[stream-out]: options.md#optionsstreamout
