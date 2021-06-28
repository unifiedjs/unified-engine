'use strict'

var trough = require('trough')
var configure = require('./configure.js')
var fileSystem = require('./file-system.js')
var stdin = require('./stdin.js')
var transform = require('./transform.js')
var log = require('./log.js')

module.exports = trough()
  .use(configure)
  .use(fileSystem)
  .use(stdin)
  .use(transform)
  .use(log)
