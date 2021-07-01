import preset from './preset/index.js'
import plugin from './preset/plugin.js'

const config = {
  plugins: [preset, [plugin, {two: false, three: true}]]
}

export default config
