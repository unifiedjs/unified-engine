import {Configuration} from '../configuration.js'

export function configure(context, settings) {
  context.configuration = new Configuration(settings)
}
