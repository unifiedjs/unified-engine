import plugin from './plugin.js'

/** @type {import('../../../../index.js').Preset} */
const config = {plugins: [[plugin, {one: true, two: true}]]}

export default config
