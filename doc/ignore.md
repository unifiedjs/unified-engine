# Ignoring

[`unified-engine`][api] accepts patterns to ignore when searching for files to
process through ignore files.

## Explicit ignoring

One ignore file can be given through [`ignorePath`][ignore-path], this is loaded
regardless of [`detectIgnore`][detect-ignore] and [`ignoreName`][ignore-name].

## Implicit ignoring

Otherwise, ignore files are detected if [`detectIgnore`][detect-ignore] is
turned on and [`ignoreName`][ignore-name] is given.

The first file named `ignoreName` in the parent directory of a checked path is
used.
Or, if no file is found, the parent directory if searched, and so on.

## Additional ignoring

In addition to explicit and implicit ignore files, other patterns can be given
with [`ignorePatterns`][ignore-patterns].
The format of each pattern in `ignorePattern` is the same as a line in an ignore
file.
Patterns and files are resolved based on the current working directory.

## Ignoring

Ignoring is used when searching for files in directories.
If paths (including those expanded from globs) are passed in that are ignored,
an error is thrown.
These files can be silently ignored by turning on
[`silentlyIgnore`][silently-ignore].

Normally, files are ignored based on the path of the found ignore file and the
patterns inside it.
Patterns passed with [`ignorePatterns`][ignore-patterns] are resolved based on
the current working directory.

Patterns in [`ignorePath`][ignore-path] and [`ignorePatterns`][ignore-patterns]
can be resolved from somewhere else by passing [`ignoreFrom`][ignore-from].

If paths or globs to directories are given to the engine, they will be searched
for matching files, but `node_modules` and hidden directories (those starting
with a dot, `.`, such as `.git`) are normally not searched.
Pass paths or globs to files or those directories to include files inside
`node_modules` and hidden directories.

The format for ignore files is the same as [`.gitignore`][gitignore], so it’s
possible to pass a `.gitignore` in as [`ignorePath`][ignore-path].

[`node-ignore`][node-ignore] is used under the hood, see its documentation
for more information.

###### Example

An example **ignore** file could look as follows:

```ini
# Duo dependencies.
components

# Fixtures.
test/{input,tree}
```

<!-- Definitions -->

[api]: ../readme.md#api

[detect-ignore]: options.md#optionsdetectignore

[ignore-name]: options.md#optionsignorename

[ignore-path]: options.md#optionsignorepath

[ignore-patterns]: options.md#optionsignorepatterns

[ignore-from]: options.md#optionsignorefrom

[silently-ignore]: options.md#optionssilentlyignore

[gitignore]: https://git-scm.com/docs/gitignore

[node-ignore]: https://github.com/kaelzhang/node-ignore
