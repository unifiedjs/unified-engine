/**
 * @import {Preset} from 'unified-engine'
 */

import plugin from './plugin.js'

/** @type {Preset} */
const config = {plugins: [[plugin, {one: true, two: true}]]}

export default config
