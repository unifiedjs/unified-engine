import path from 'path'
import jsYaml from 'js-yaml'
import parseJson from 'parse-json'
import createDebug from 'debug'
import {resolvePlugin} from 'load-plugin'
import isPlainObj from 'is-plain-obj'
import {fault} from 'fault'
import {FindUp} from './find-up.js'

const debug = createDebug('unified-engine:configuration')

const own = {}.hasOwnProperty

const loaders = {
  '.json': loadJson,
  '.cjs': loadScriptOrModule,
  '.mjs': loadScriptOrModule,
  '.js': loadScriptOrModule,
  '.yaml': loadYaml,
  '.yml': loadYaml
}

const defaultLoader = loadJson

export class Configuration {
  constructor(options) {
    const names = []

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
      names,
      create: this.create
    })
  }

  load(filePath, callback) {
    this.findUp.load(
      filePath || path.resolve(this.cwd, 'stdin.js'),
      (error, file) => {
        if (error || file) {
          return callback(error, file)
        }

        this.create().then((result) => {
          callback(null, result)
        }, callback)
      }
    )
  }
}

async function create(buf, filePath) {
  const fn = (filePath && loaders[path.extname(filePath)]) || defaultLoader
  const options = {prefix: this.pluginPrefix, cwd: this.cwd}
  const result = {settings: {}, plugins: []}
  let value

  if (filePath) {
    value = await fn.call(this, buf, filePath)
  }

  if (this.configTransform && value !== undefined) {
    value = this.configTransform(value, filePath)
  }

  // Exit if we did find a `package.json`, but it does not have configuration.
  if (
    buf &&
    value === undefined &&
    path.basename(filePath) === 'package.json'
  ) {
    return
  }

  if (value === undefined) {
    if (this.defaultConfig) {
      await merge(
        result,
        this.defaultConfig,
        Object.assign({}, options, {root: this.cwd})
      )
    }
  } else {
    await merge(
      result,
      value,
      Object.assign({}, options, {root: path.dirname(filePath)})
    )
  }

  await merge(result, this.given, Object.assign({}, options, {root: this.cwd}))

  return result
}

function loadScriptOrModule(_, filePath) {
  return loadFromAbsolutePath(filePath, this.cwd)
}

function loadYaml(buf, filePath) {
  return jsYaml.load(buf, {filename: path.basename(filePath)})
}

function loadJson(buf, filePath) {
  let result = parseJson(buf, filePath)

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
    const plugins = result.plugins

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
    let index = -1

    while (++index < result.length) {
      const value = result[index]

      // Keep order sequential instead of parallel.
      // eslint-disable-next-line no-await-in-loop
      await (value !== null && typeof value === 'object' && 'length' in value
        ? use(...value)
        : use(value))
    }
  }

  async function addIn(result) {
    let key

    for (key in result) {
      if (own.call(result, key)) {
        // Keep order sequential instead of parallel.
        // eslint-disable-next-line no-await-in-loop
        await use(key, result[key])
      }
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
    let fp

    try {
      fp = await resolvePlugin(id, {
        cwd: options.root,
        prefix: options.prefix
      })
    } catch (error) {
      addPlugin(() => {
        throw fault('Could not find module `%s`\n%s', id, error.stack)
      }, value)
      return
    }

    const result = await loadFromAbsolutePath(fp, options.root)

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
    } catch {
      throw fault(
        'Error: Expected preset or plugin, not %s, at `%s`',
        result,
        path.relative(options.root, fp)
      )
    }
  }

  function addPlugin(result, value) {
    const entry = find(target.plugins, result)

    if (entry) {
      reconfigure(entry, value)
    } else {
      target.plugins.push([result, value])
    }
  }
}

function reconfigure(entry, value) {
  if (isPlainObj(entry[1]) && isPlainObj(value)) {
    value = Object.assign({}, entry[1], value)
  }

  entry[1] = value
}

function find(entries, plugin) {
  let index = -1

  while (++index < entries.length) {
    if (entries[index][0] === plugin) {
      return entries[index]
    }
  }
}

async function loadFromAbsolutePath(fp, base) {
  let result

  try {
    result = (await import(fp)).default
  } catch (error) {
    throw fault('Cannot import `%s`\n%s', path.relative(base, fp), error.stack)
  }

  if (result && typeof result === 'object' && result.__esModule) {
    result = result.default
  }

  return result
}
