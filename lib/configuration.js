'use strict'

var path = require('path')
var yaml = require('js-yaml')
var json = require('parse-json')
var debug = require('debug')('unified-engine:configuration')
var loadPlugin = require('load-plugin')
var plain = require('is-plain-obj')
var fault = require('fault')
var FindUp = require('./find-up.js')

module.exports = Config

var own = {}.hasOwnProperty

var loaders = {
  '.json': loadJson,
  '.cjs': loadScriptOrModule,
  '.mjs': loadScriptOrModule,
  '.js': loadScriptOrModule,
  '.yaml': loadYaml,
  '.yml': loadYaml
}

var defaultLoader = loadJson

Config.prototype.load = load

function Config(options) {
  var names = []

  this.cwd = options.cwd
  this.packageField = options.packageField
  this.pluginPrefix = options.pluginPrefix
  this.configTransform = options.configTransform
  this.defaultConfig = options.defaultConfig

  if (options.rcName) {
    names.push(
      options.rcName,
      options.rcName + '.js',
      options.rcName + '.yml',
      options.rcName + '.yaml'
    )
    debug('Looking for `%s` configuration files', names)
  }

  if (options.packageField) {
    names.push('package.json')
    debug(
      'Looking for `%s` fields in `package.json` files',
      options.packageField
    )
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

  self.findUp.load(filePath || path.resolve(this.cwd, 'stdin.js'), done)

  function done(error, file) {
    if (error || file) {
      return callback(error, file)
    }

    self.create().then(function (result) {
      callback(null, result)
    }, callback)
  }
}

async function create(buf, filePath) {
  var self = this
  var fn = (filePath && loaders[path.extname(filePath)]) || defaultLoader
  var options = {prefix: self.pluginPrefix, cwd: self.cwd}
  var result = {settings: {}, plugins: []}
  var contents

  if (filePath) {
    contents = await fn.apply(self, arguments)
  }

  if (self.configTransform && contents !== undefined) {
    contents = self.configTransform(contents, filePath)
  }

  // Exit if we did find a `package.json`, but it does not have configuration.
  if (
    buf &&
    contents === undefined &&
    path.basename(filePath) === 'package.json'
  ) {
    return
  }

  if (contents === undefined) {
    if (self.defaultConfig) {
      await merge(
        result,
        self.defaultConfig,
        Object.assign({}, options, {root: self.cwd})
      )
    }
  } else {
    await merge(
      result,
      contents,
      Object.assign({}, options, {root: path.dirname(filePath)})
    )
  }

  await merge(result, self.given, Object.assign({}, options, {root: self.cwd}))

  return result
}

function loadScriptOrModule(_, filePath) {
  return loadFromAbsolutePath(filePath, this.cwd)
}

function loadYaml(buf, filePath) {
  return yaml.safeLoad(buf, {filename: path.basename(filePath)})
}

function loadJson(buf, filePath) {
  var result = json(buf, filePath)

  if (path.basename(filePath) === 'package.json') {
    result = result[this.packageField]
  }

  return result
}

async function merge(target, raw, options) {
  if (typeof raw === 'object' && raw !== null) {
    await addPreset(raw)
  } else {
    throw new Error('Expected preset, not `' + raw + '`')
  }

  return target

  async function addPreset(result) {
    var plugins = result.plugins

    if (plugins === null || plugins === undefined) {
      // Empty.
    } else if (typeof plugins === 'object' && plugins !== null) {
      await ('length' in plugins ? addEach(plugins) : addIn(plugins))
    } else {
      throw new Error(
        'Expected a list or object of plugins, not `' + plugins + '`'
      )
    }

    target.settings = Object.assign({}, target.settings, result.settings)
  }

  async function addEach(result) {
    var index = -1
    var value

    while (++index < result.length) {
      value = result[index]

      // Keep order sequential instead of parallel.
      // eslint-disable-next-line no-await-in-loop
      await (value !== null && typeof value === 'object' && 'length' in value
        ? use.apply(null, value)
        : use(value))
    }
  }

  async function addIn(result) {
    var key

    for (key in result) {
      // Keep order sequential instead of parallel.
      // eslint-disable-next-line no-await-in-loop
      await use(key, result[key])
    }
  }

  async function use(usable, value) {
    if (typeof usable === 'string') {
      await addModule(usable, value)
    } else if (typeof usable === 'function') {
      addPlugin(usable, value)
    } else {
      await merge(target, usable, options)
    }
  }

  async function addModule(id, value) {
    var fp = loadPlugin.resolve(id, {cwd: options.root, prefix: options.prefix})
    var result

    if (fp) {
      result = await loadFromAbsolutePath(fp, options.root)

      try {
        if (typeof result === 'function') {
          addPlugin(result, value)
        } else {
          await merge(
            target,
            result,
            Object.assign({}, options, {root: path.dirname(fp)})
          )
        }
      } catch (_) {
        throw fault(
          'Error: Expected preset or plugin, not %s, at `%s`',
          result,
          path.relative(options.root, fp)
        )
      }
    } else {
      fp = path.relative(options.cwd, path.resolve(options.root, id))
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
  var index = -1

  while (++index < entries.length) {
    if (entries[index][0] === plugin) {
      return entries[index]
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

async function loadFromAbsolutePath(fp, base) {
  var ext = path.extname(fp)
  var result

  /* istanbul ignore next - To do next major: Tests don’t run on Node 10 */
  if (ext !== '.mjs') {
    try {
      result = require(fp)
    } catch (error) {
      if (ext !== '.cjs' && error.code === 'ERR_REQUIRE_ESM') {
        ext = '.mjs'
      } else {
        throw fault(
          'Cannot parse script `%s`\n%s',
          path.relative(base, fp),
          error.stack
        )
      }
    }

    if (result && typeof result === 'object' && result.__esModule) {
      result = result.default
    }
  }

  /* istanbul ignore next - To do next major: Tests don’t run on Node 10 */
  if (ext === '.mjs') {
    result = (await import(fp)).default
  }

  return result
}
