# Plug-ins

[**unified-engine**][api] supports plug-ins as `function`s from
engine authors (from [`injectedPlugins`][injected-plugins]) and plug-in
names from engine users ([`plugins`][plugins] and [configuration
files][configure]).

Normally, **unified** plug-ins receive upon attaching two arguments:
`processor` (the [`Processor`][unified-processor] it’s attached to) and
`options` (an `Object` users can provide to configure the plug-in).

If a plug-in is attached by **unified-engine**, a third argument is
given: [`fileSet`][file-set].

###### Example

The following example processes `readme.md` and uses a plug-in
which adds a “completer” and another file (`history.md`).

```js
var engine = require('unified-engine');
var remark = require('remark');

function plugin(processor, options, set) {
  function completer(set) {
    console.log('done:', set.valueOf().map(function (file) {
      return file.path;
    }));
  }

  /* Ensure the completer runs once per file-set. */
  completer.pluginId = 'some-plugin-id';

  set.use(completer);

  set.add('history.md');
}

engine({
  processor: remark(),
  injectedPlugins: [plugin],
  globs: ['readme.md']
}, function (err) {
  if (err) throw err;
});
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
to plug-ins as an argument to the attacher.

### `fileSet.valueOf()`

Access the files in a set.  Returns a list of [`VFile`][vfile]s being
processed.

### `fileSet.add(file|filePath)`

Add a file to be processed.  The given file is processed like
other files with a few differences.  The added files are:

*   Ignored when their file-path is already added;
*   Never written to the file-system or [`streamOut`][stream-out];
*   Not reporter.

Returns self.

###### Parameters

*   `filePath` (`string`) — Path to virtual file;
*   `file` ([`VFile`][vfile]) — Virtual file.

### `fileSet.use(completer)`

Attach a [`completer`][completer] to a middleware pipeline which runs
when all files are transformed (before compilation).  Returns self.

#### `function completer(fileSet[, next])`

Function invoked when all files are processed.

If an error occurs (either because it’s thrown, returned, rejected, or
passed to [`next`][next]), no further completers run and all files fail.

###### Parameters

*   `fileSet` ([**FileSet**][file-set]);
*   `next` ([`Function`][next], optional).

###### Returns

*   `Error`.
*   `Promise` — If a promise is returned, the function is asynchronous,
    and **must** be resolved (with nothing) or rejected (with an `Error`).

###### Properties

*   `pluginId` (`string`) — Plug-ins specified through various
    mechanisms are attached to a new [`processor`][unified-processor]
    for each file.  If a `completer` is `use`d multiple times, it is
    invoked multiple times as well.  To ensure completers don’t get
    re-attached, specify a `pluginId`.  This will ensure only one
    completer per `pluginId` is added.

##### `function next([err])`

If the signature of a completer includes `next` (second argument),
the function **may** finish asynchronous, and **must** invoke
`next()`.

###### Parameters

*   `err` (`Error`, optional) — Fatal error.

<!-- Definitions -->

[vfile]: https://github.com/wooorm/vfile

[unified-processor]: https://github.com/wooorm/unified#processor

[api]: ../readme.md#api

[configure]: configure.md

[completer]: #function-completerfileset-next

[next]: #function-nexterr

[file-set]: #fileset

[injected-plugins]: options.md#optionsinjectedplugins

[plugins]: options.md#optionsplugins

[stream-out]: options.md#optionsstreamout
