'use strict'

var path = require('path')
var Module = require('module')
var yaml = require('js-yaml')
var json = require('parse-json')
var debug = require('debug')('unified-engine:configuration')
var resolve = require('load-plugin').resolve
var plain = require('is-plain-obj')
var fault = require('fault')
var FindUp = require('./find-up')

module.exports = Config

var own = {}.hasOwnProperty
var extname = path.extname
var basename = path.basename
var dirname = path.dirname
var relative = path.relative

var loaders = {
  '.json': loadJson,
  '.js': loadScript,
  '.yaml': loadYaml,
  '.yml': loadYaml
}

var defaultLoader = loadJson

Config.prototype.load = load

function Config(options) {
  var rcName = options.rcName
  var packageField = options.packageField
  var names = []

  this.cwd = options.cwd
  this.packageField = options.packageField
  this.pluginPrefix = options.pluginPrefix
  this.configTransform = options.configTransform
  this.defaultConfig = options.defaultConfig

  if (rcName) {
    names.push(rcName, rcName + '.js', rcName + '.yml', rcName + '.yaml')
    debug('Looking for `%s` configuration files', names)
  }

  if (packageField) {
    names.push('package.json')
    debug('Looking for `%s` fields in `package.json` files', packageField)
  }

  this.given = {settings: options.settings, plugins: options.plugins}
  this.create = create.bind(this)

  this.findUp = new FindUp({
    filePath: options.rcPath,
    cwd: options.cwd,
    detect: options.detectConfig,
    names: names,
    create: this.create
  })
}

function load(filePath, callback) {
  var self = this
  var searchPath = filePath || path.resolve(this.cwd, 'stdin.js')

  self.findUp.load(searchPath, done)

  function done(error, file) {
    if (error || file) {
      return callback(error, file)
    }

    callback(null, self.create())
  }
}

function create(buf, filePath) {
  var self = this
  var transform = self.configTransform
  var defaults = self.defaultConfig
  var fn = (filePath && loaders[extname(filePath)]) || defaultLoader
  var options = {prefix: self.pluginPrefix, cwd: self.cwd}
  var result = {settings: {}, plugins: []}
  var contents = buf ? fn.apply(self, arguments) : undefined

  if (transform && contents !== undefined) {
    contents = transform(contents, filePath)
  }

  // Exit if we did find a `package.json`, but it does not have configuration.
  if (buf && contents === undefined && basename(filePath) === 'package.json') {
    return
  }

  if (contents === undefined) {
    if (defaults) {
      merge(result, defaults, Object.assign({}, options, {root: self.cwd}))
    }
  } else {
    merge(
      result,
      contents,
      Object.assign({}, options, {root: dirname(filePath)})
    )
  }

  merge(result, self.given, Object.assign({}, options, {root: self.cwd}))

  return result
}

// Basically `Module.prototype.load`, but for a buffer instead of a file path.
function loadScript(buf, filePath) {
  var submodule = Module._cache[filePath]

  if (!submodule) {
    submodule = new Module(filePath, module)
    submodule.filename = filePath
    submodule.paths = Module._nodeModulePaths(dirname(filePath))
    submodule._compile(String(buf), filePath)
    submodule.loaded = true
    Module._cache[filePath] = submodule
  }

  return submodule.exports
}

function loadYaml(buf, filePath) {
  return yaml.safeLoad(buf, {filename: basename(filePath)})
}

function loadJson(buf, filePath) {
  var result = json(buf, filePath)

  if (basename(filePath) === 'package.json') {
    result = result[this.packageField]
  }

  return result
}

function merge(target, raw, options) {
  var root = options.root
  var cwd = options.cwd
  var prefix = options.prefix

  if (typeof raw === 'object' && raw !== null) {
    addPreset(raw)
  } else {
    throw new Error('Expected preset, not `' + raw + '`')
  }

  return target

  function addPreset(result) {
    var plugins = result.plugins

    if (plugins === null || plugins === undefined) {
      // Empty.
    } else if (typeof plugins === 'object' && plugins !== null) {
      if ('length' in plugins) {
        addEach(plugins)
      } else {
        addIn(plugins)
      }
    } else {
      throw new Error(
        'Expected a list or object of plugins, not `' + plugins + '`'
      )
    }

    target.settings = Object.assign({}, target.settings, result.settings)
  }

  function addEach(result) {
    var length = result.length
    var index = -1
    var value

    while (++index < length) {
      value = result[index]

      if (value !== null && typeof value === 'object' && 'length' in value) {
        use.apply(null, value)
      } else {
        use(value)
      }
    }
  }

  function addIn(result) {
    var key

    for (key in result) {
      use(key, result[key])
    }
  }

  function use(usable, value) {
    if (typeof usable === 'string') {
      addModule(usable, value)
    } else if (typeof usable === 'function') {
      addPlugin(usable, value)
    } else {
      merge(target, usable, options)
    }
  }

  function addModule(id, value) {
    var fp = resolve(id, {cwd: root, prefix: prefix})
    var result

    if (fp) {
      try {
        result = require(fp)
      } catch (error) {
        throw fault(
          'Cannot parse script `%s`\n%s',
          relative(root, fp),
          error.stack
        )
      }

      try {
        if (typeof result === 'function') {
          addPlugin(result, value)
        } else {
          merge(target, result, Object.assign({}, options, {root: dirname(fp)}))
        }
      } catch (_) {
        throw fault(
          'Error: Expected preset or plugin, not %s, at `%s`',
          result,
          relative(root, fp)
        )
      }
    } else {
      fp = relative(cwd, path.resolve(root, id))
      addPlugin(
        failingModule(fp, new Error('Could not find module `' + id + '`')),
        value
      )
    }
  }

  function addPlugin(result, value) {
    var entry = find(target.plugins, result)

    if (entry) {
      reconfigure(entry, value)
    } else {
      target.plugins.push([result, value])
    }
  }
}

function reconfigure(entry, value) {
  if (plain(entry[1]) && plain(value)) {
    value = Object.assign({}, entry[1], value)
  }

  entry[1] = value
}

function find(entries, plugin) {
  var length = entries.length
  var index = -1
  var entry

  while (++index < length) {
    entry = entries[index]

    if (entry[0] === plugin) {
      return entry
    }
  }
}

function failingModule(id, error) {
  var cache = failingModule.cache || (failingModule.cache = {})
  var submodule = own.call(cache, id) ? cache[id] : (cache[id] = fail)
  return submodule
  function fail() {
    throw error
  }
}
