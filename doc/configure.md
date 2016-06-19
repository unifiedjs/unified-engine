# Configuration

<!--lint disable heading-increment no-duplicate-headings-->

[**unified-engine**][api] accepts configuration through options and
through configuration files.

*   Configuration files are detected if [`detectConfig`][detect-config]
    is turned on, depending on the following options:

    *   If [`rcName`][rc-name] is given, `$rcName` (JSON) and
        `$rcName.js` (CommonJS) are loaded;

    *   If [`packageField`][package-field] is given, `package.json`
        (JSON) files are loaded and their `$packageField`s are
        used as configuration.

*   One configuration file (JSON) can be given through [`rcPath`][rc-path],
    this is loaded regardless of `detectConfig` and `rcName`.

###### Example

An example **rc** file could look as follows:

```json
{
  "output": true,
  "settings": {
    "bullet": "*",
    "ruleRepetition": 3,
    "fences": true
  },
  "plugins": {
    "inline-links": null,
    "lint": {
      "external": [
        "remark-lint-no-empty-sections"
      ],
      "maximum-line-length": false
    }
  }
}
```

###### Example

An example **rc.js** file could look as follows:

```js
/**
 * @fileoverview Local remark configuration.
 */

module.exports = {
    'output': true,
    'plugins': {
        /* Custom natural-language validation. */
        'script/natural-language': null,
        'lint': {
            /* Ignore `final-definition` for `license` */
            'final-definition': false
        },
        'license': null
    },
    'settings': {
        /* I personally like asterisks. */
        'bullet': '*'
    }
};
```

## Table of Contents

*   [Cascade](#cascade)
*   [Schema](#schema)

## Cascade

Precedence is as follows (earlier represents higher precedence):

*   [`plugins`][plugins], [`settings`][settings], and [`output`][output]
    passed in [`options`][options];

*   Configuration from [`rcPath`][rc-path] in [`options`][options];

*   Configuration from `$rcName`, `$rcName.js`, and `$packageField`
    fields in `package.json` in the directory of the processed file,
    and in ancestral directories;

*   Files named [`$rcName`][rc-name], `$rcName.js`, and
    [`$packageField`][package-field] fields in `package.json` in the
    directory of the processed file, and in ancestral directories;

*   If no `$rcName` or `$rcName.js`, or `$packageField` in `package.json`
    were detected, per-user configuration files (`~/$rcName` and
    `~/$rcName.js`) are used.

If more than one `$rcName`, `$rcName.js`, or `package.json` are
found in a directory, the file named `$rcName` takes precedence in the
cascade over `$rcName.js`, which in turn precedes over `package.json`.

For example, for the following project, where `rcName` is `.foorc` and
`packageField` is `fooConfig`:

```text
project
|-- docs
|   |-- .foorc
|   |-- doc.md
|
|-- .foorc.js
|-- package.json
|-- readme.md
```

Where `docs/.foorc` looks as follows:

```json
{
  "settings": {
    "bullet": "+"
  }
}
```

And `package.json` has:

```json
{
  "fooConfig": {
    "settings": {
      "bullet": "*"
    }
  }
}
```

And `.foorc.js` has:

```js
module.exports = {
  settings: {
    bullet: '-'
  }
};
```

Then, when compiling `docs/doc.md`, `bullet: '+'` would be used because
`docs/.foorc` takes precedence over `.foorc.js` and `package.json`.

When compiling `readme.md`, `bullet: "-"` would be used because `.foorc.js`
takes precedence over `package.json`.

## Schema

The following properties are currently used in configuration files.

###### `output`

The `output` field, related to [`output`][output] in `options`, specifies
whether files should be written to the file-system.  Can be either
`boolean`, or `string`.

```json
{
  "output": "man/"
}
```

*   Type: `string` or `boolean`;
*   Default: `false`.

###### `settings`

The `settings` field, related to [`settings`][settings] in `options`,
configures the parser and compiler of the processor.

```json
{
  "settings": {
    "position": "false"
  }
}
```

*   Type: `Object`.

###### `plugins`

The `plugins` field, related to [`plugins`][plugins] in `options`, has
either an array of plug-in names (or paths) or an object mapping plug-in’s
to their options.

Plug-in options can be `false`, which specifies that a plug-in should
not be used.  In all other cases, they are treated as an object, and
merged by the cascade.  Thus, it’s possible to specify part of the
options from one configuration file, and overwrite or extend it from
another file.

Accepts an array:

```json
{
  "plugins": [
    "foo",
    "bar"
  ]
}
```

Or an object:

```json
{
  "plugins": {
    "foo": null,
    "bar": {
      "baz": "qux"
    }
  }
}
```

*   Type: `Array.<string>` or `Object.<string, Object>`.

<!-- Definitions -->

[api]: ../readme.md#api

[options]: options.md#options

[rc-path]: options.md#optionsrcpath

[settings]: options.md#optionssettings

[output]: options.md#optionsoutput

[detect-config]: options.md#optionsdetectconfig

[rc-name]: options.md#optionsrcname

[package-field]: options.md#optionspackagefield

[plugins]: options.md#optionsplugins
