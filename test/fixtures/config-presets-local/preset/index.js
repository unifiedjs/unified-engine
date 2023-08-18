/** @type {import('unified-engine').Preset} */
const config = {
  plugins: {
    './plugin.js': {one: true, two: true}
  }
}

export default config
