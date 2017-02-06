# Ignoring

[**unified-engine**][api] accepts patterns to ignore when looking for
files to process, through ignore files.

*   Ignore files are detected if [`detectIgnore`][detect-ignore]
    is turned on and [`ignoreName`][ignore-name] is given.
*   One ignore file can be given through [`ignorePath`][ignore-path],
    this is loaded regardless of `detectIgnore` and `ignoreName`,
    and turns off searching for other ignore files.

Ignore files do not cascade.  Before searching for [`files`][files] in
[`cwd`][cwd], that directory and all its ancestral directories are
searched for files named `$ignoreName`.  If multiple ignore files are
found, the closest one to `cwd` takes precedence.

If paths or globs to directories are given to the engine, they will be searched
for matching files, but `node_modules` and hidden directories (those starting
with a dot, `.`, such as `.git`) are normally not searched.  Pass paths or globs
to files instead to include files inside `node_modules` and hidden directories.

The format for **ignore** files is the same as [`.gitignore`][gitignore] files,
so it’s also possible to pass those for [`ignorePath`][ignore-path] in
[`options`][options]. [**node-ignore**][node-ignore] is used under the hood, see
its documentation for more information.

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

[options]: options.md#options

[cwd]: options.md#optionscwd

[files]: options.md#optionsfiles

[detect-ignore]: options.md#optionsdetectignore

[ignore-name]: options.md#optionsignorename

[ignore-path]: options.md#optionsignorepath

[gitignore]: https://git-scm.com/docs/gitignore

[node-ignore]: https://github.com/kaelzhang/node-ignore
