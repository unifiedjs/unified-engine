/**
 * @import {Preset} from 'unified-engine'
 */

import preset from './preset/index.js'
import plugin from './preset/plugin.js'

/** @type {Preset} */
const config = {
  plugins: [preset, [plugin, {three: true, two: false}]]
}

export default config
