exports.plugins = [
  require('./preset'),
  [require('./preset/plugin'), {two: false, three: true}]
]
