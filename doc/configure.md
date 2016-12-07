# Configuration

[**unified-engine**][api] accepts configuration through options and
through configuration files.

*   Configuration files are detected if [`detectConfig`][detect-config]
    is turned on, depending on the following options:
    *   If [`rcName`][rc-name] is given, `$rcName` (JSON) and
        `$rcName.js` (CommonJS), and `$rcName.yaml` (YAML) are loaded;
    *   If [`packageField`][package-field] is given, `package.json`
        (JSON) files are loaded and their `$packageField`s are
        used as configuration.
*   One configuration file can be given through [`rcPath`][rc-path],
    this is loaded regardless of `detectConfig` and `rcName`.

###### Example

An example **rc** file could look as follows:

```json
{
  "output": true,
  "presets": ["lint-recommended"],
  "settings": {
    "bullet": "*",
    "ruleRepetition": 3,
    "fences": true
  },
  "plugins": ["inline-links"]
}
```

###### Example

Scripts expose either an object, or a function which when invoked
returns an object.  The latter is given the current configuration for
a file.  This configuration always has a `plugins` object where the
keys are resolved absolute paths to plugins, where the values are
objects or `false`.

An example **rc.js** file could look as follows:

```js
module.exports = {
  output: true,
  preset: 'lint-recommended',
  plugins: [
    /* Custom natural-language validation. */
    './script/natural-language',
    'license'
  ],
  settings: {
    /* I personally like asterisks. */
    bullet: '*'
  }
};
```

###### Example

An example **rc.yaml** file could look as follows:

```js
output: true
plugins:
  - lint
  - document
  - minify
settings:
  verbose: true
  quote: "'"
  quoteSmart: true
  preferUnquoted: true
```

## Table of Contents

*   [Cascade](#cascade)
*   [Schema](#schema)

## Cascade

Precedence is as follows (earlier represents higher precedence):

*   [`plugins`][plugins], [`settings`][settings], and [`output`][output]
    passed in [`options`][options];
*   Configuration from [`rcPath`][rc-path] in [`options`][options];
*   Configuration from `$rcName`, `$rcName.js`, `$rcName.yaml`, and
    `$packageField` fields in `package.json` in the directory of the
    processed file, and in ancestral directories;
*   Files named [`$rcName`][rc-name], `$rcName.js`, `$rcName.yaml`, and
    [`$packageField`][package-field] fields in `package.json` in the
    directory of the processed file, and in ancestral directories;
*   If no `$rcName`, `$rcName.js`, `$rcName.yaml`, or `$packageField`
    in `package.json` were detected, per-user configuration files
    (`~/$rcName`, `~/$rcName.js`, `~/$rcName.yaml`) are used.

If more than one `$rcName`, `$rcName.js`, `$rcName.yaml`, or
`package.json` are found in a directory, the file named `$rcName`
takes precedence in the cascade over `$rcName.js`, which in turn
precedes over `$rcName.yaml`, which in turn precedes over `package.json`.

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

###### `presets`

The `presets` field has either a list of preset names (or paths) or an
object mapping presets to their options.  It’s also possible to pass
one preset by passing a `string`.

Presets are in fact configuration files as well: go ahead and publish
your configuration files, if they’re in JSON or JS, on npm.

Accepts a string:

```json
{
  "presets": "foo"
}
```

Accepts an array:

```json
{
  "presets": [
    "foo",
    "bar"
  ]
}
```

Or an object:

```json
{
  "presets": {
    "foo": null,
    "bar": {
      "baz": "qux"
    }
  }
}
```

*   Type: `string`, `Array.<string>` or `Object.<string, Object>`.

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
