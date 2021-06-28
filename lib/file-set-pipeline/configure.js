'use strict'

var Configuration = require('../configuration.js')

module.exports = configure

function configure(context, settings) {
  context.configuration = new Configuration(settings)
}
