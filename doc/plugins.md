# Plugins

Normally, **unified** plugins receive a single `options` argument upon attaching
(an`Object` users can provide to configure the plugin).

If a plugin is attached by **unified-engine**, a second argument is given:
[`fileSet`][file-set].

###### Example

The following example processes `readme.md` and uses a plugin that adds a
“completer” and another file (`history.md`).

```js
import {engine} from 'unified-engine'
import {remark} from 'remark'

// Ensure the completer runs once per file-set.
completer.pluginId = 'some-plugin-id'

engine(
  {
    processor: remark(),
    plugins: [plugin],
    files: ['readme.md']
  },
  done
)

function done(error) {
  if (error) throw error
}

function plugin(options, set) {
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

Note that `history.md` is not reported: only files given by the user are
reported (or written).

## Contents

*   [`FileSet`](#fileset)
    *   [`fileSet.valueOf()`](#filesetvalueof)
    *   [`fileSet.add(file|filePath)`](#filesetaddfilefilepath)
    *   [`fileSet.use(completer)`](#filesetusecompleter)

## `FileSet`

Internally, a `fileSet` is created to process multiple files through **unified**
processors.
This set, containing all files, is exposed to plugins as an argument to the
attacher.

### `fileSet.valueOf()`

Access the files in a set.
Returns a list of [`VFile`][vfile]s being processed.

### `fileSet.add(file|filePath)`

Add a file to be processed.
The given file is processed like other files with a few differences.
The added files are:

*   Ignored when their file path is already added
*   Never written to the file system or [`streamOut`][stream-out]
*   Not reported for

Returns self.

###### Parameters

*   `filePath` (`string`) — path to virtual file
*   `file` ([`VFile`][vfile]) — virtual file

### `fileSet.use(completer)`

Attach a [`completer`][completer] to a middleware pipeline which runs when all
files are transformed (before compilation).
Returns self.

#### `function completer(fileSet[, next])`

Function called when all files are processed.

If an error occurs (either because it’s thrown, returned, rejected, or passed to
[`next`][next]), no further completers run and all files fail.

###### Parameters

*   `fileSet` ([**FileSet**][file-set])
*   `next` ([`Function`][next], optional)

###### Returns

*   `Error`
*   `Promise` — if a promise is returned, the function is asynchronous, and
    **must** be resolved (with nothing) or rejected (with an `Error`)

###### Properties

*   `pluginId` (`string`) — plugins specified through various mechanisms are
    attached to a new [`processor`][unified-processor] for each file.
    If a `completer` is `use`d multiple times, it is called multiple times as
    well.
    To prevent completers from attaching multiple times, specify a `pluginId`.
    This will ensure only one completer per `pluginId` is added.

##### `function next([error])`

If the signature of a completer includes `next` (second argument), the function
**may** finish asynchronous, and **must** call `next()`.

###### Parameters

*   `error` (`Error`, optional) — fatal error

<!-- Definitions -->

[vfile]: https://github.com/vfile/vfile

[unified-processor]: https://github.com/unifiedjs/unified#processor

[completer]: #function-completerfileset-next

[next]: #function-nexterror

[file-set]: #fileset

[stream-out]: options.md#optionsstreamout
