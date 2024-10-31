/**
 * @import {Preset} from 'unified-engine'
 */

/** @type {Preset} */
const config = {plugins: [['./plugin.js', {one: true, two: true}]]}

export default config
