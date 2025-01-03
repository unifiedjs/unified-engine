/**
 * @import {Pipeline} from 'trough'
 */

import {trough} from 'trough'
import {configure} from './configure.js'
import {fileSystem} from './file-system.js'
import {log} from './log.js'
import {stdin} from './stdin.js'
import {transform} from './transform.js'

/** @type {Pipeline} */
export const fileSetPipeline = trough()
  .use(configure)
  .use(fileSystem)
  .use(stdin)
  .use(transform)
  .use(log)
