# Ignoring

[**unified-engine**][api] accepts patterns to ignore when looking for
files to process, through ignore files.

*   Ignore files are detected if [`detectIgnore`][detect-ignore]
    is turned on and [`ignoreName`][ignore-name] is given.
*   One ignore file can be given through [`ignorePath`][ignore-path],
    this is loaded regardless of `detectIgnore` and `ignoreName`,
    and turns off searching for other ignore files.

Ignore files do not cascade.  Before searching for [`globs`][globs] in
[`cwd`][cwd], that directory and all its ancestral directories are
searched for files named `$ignoreName`.  If multiple ignore files are
found, the closest one to `cwd` takes precedence.

`node_modules` and hidden directories (those starting with a dot, `.`),
such as `.git` are normally not searched.  These can be included by
either passing them directly in `globs`, or by using a negated ignore
pattern (for example, `!.git`).  Note that this results in poor
performance because _all_ paths must be searched.

###### Example

An example **ignore** file could look as follows:

```ini
# Duo dependencies.
components

# Fixtures.
test/{input,tree}

!some/.hidden/directory
```

## Syntax

Each line in an ignore file provides a pattern which describes whether
to ignore a given path.

*   Lines are trimmed of white space;
*   Empty lines are ignored;
*   Lines which start with an octothorp (`#`) are ignored;
*   Lines which start with an interrogation-mark (`!`) negate, thus
    re-adding an ignored file path.  **Note**: using negation patterns
    comes at a significant performance cost.

For documentation on support of wild-cards (`*`, `?`), brace expressions
(`{one,two}`), and more, see [`minimatch`][minimatch].

This format is the same as **gitignore**(5), so it’s also possible to
pass those for [`ignorePath`][ignore-path] in [`options`][options].

<!-- Definitions -->

[api]: ../readme.md#api

[minimatch]: https://github.com/isaacs/minimatch

[options]: options.md#options

[cwd]: options.md#optionscwd

[globs]: options.md#optionsglobs

[detect-ignore]: options.md#optionsdetectignore

[ignore-name]: options.md#optionsignorename

[ignore-path]: options.md#optionsignorepath
