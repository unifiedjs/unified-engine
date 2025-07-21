import type {Preset} from 'unified-engine'

declare module 'unified' {
  interface Settings {
    foo: string
  }
}

const config: Preset = {
  settings: {
    foo: 'bar'
  }
}

export default config
