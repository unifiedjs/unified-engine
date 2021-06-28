# Configuration

[`unified-engine`][api] accepts configuration through options and through
configuration files.

## Explicit configuration

One configuration file can be given through [`rcPath`][rc-path], this is loaded
regardless of `detectConfig` and `rcName`.

## Implicit configuration

Otherwise, configuration files are detected if [`detectConfig`][detect-config]
is turned on, depending on the following options:

*   If [`rcName`][rc-name] is given, `$rcName` (JSON), `$rcName.js` (CommonJS or
    ESM), `$rcName.cjs` (CommonJS), `$rcName.mjs` (ESM), `$rcName.yml` (YAML),
    and `$rcName.yaml` (YAML) are loaded
*   If [`packageField`][package-field] is given, `package.json` (JSON) files
    are loaded and their `$packageField`s are used as configuration

In this case, the first file that is searched for in a directory is used as the
configuration.
If no file is found, the parent directory is searched, and so on.

###### Example

An example **rc** file could look as follows:

```json
{
  "settings": {
    "bullet": "*",
    "ruleRepetition": 3,
    "fences": true
  },
  "plugins": [
    "inline-links",
    "lint-recommended"
  ]
}
```

Another example, **rc.js**, could look as follows:

```js
exports.plugins = ['./script/natural-language', 'lint-recommended', 'license']

exports.settings = {bullet: '*'}
```

Another example, **rc.yaml**, could look as follows:

```js
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

## Schema

The following properties are currently used in configuration files.

###### `settings`

The `settings` field, related to [`settings`][settings] in `options`, configures
the parser and compiler of the processor.

```json
{
  "settings": {
    "position": "false"
  }
}
```

*   Type: `Object`

###### `plugins`

The `plugins` field, related to [`plugins`][plugins] in `options`, has either an
array of plugin names (or paths) or plugin–options tuples, or an object mapping
plugins to their options.

Plugin options can be `false`, which specifies that a plugin should not be used.
In all other cases, they are treated as an object, and merged by the cascade.
Thus, it’s possible to specify part of the options from one configuration file,
and overwrite or extend it from another file.

Accepts an array:

```json
{
  "plugins": [
    "foo",
    "bar",
    [
      "qux",
      {"quux": true}
    ]
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

*   Type: `Array.<string>` or `Object.<*>`

<!-- Definitions -->

[api]: ../readme.md#api

[rc-path]: options.md#optionsrcpath

[settings]: options.md#optionssettings

[detect-config]: options.md#optionsdetectconfig

[rc-name]: options.md#optionsrcname

[package-field]: options.md#optionspackagefield

[plugins]: options.md#optionsplugins
