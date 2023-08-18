import plugin from './plugin.js'

/** @type {import('unified-engine').Preset} */
const config = {plugins: [[plugin, {one: true, two: true}]]}

export default config
