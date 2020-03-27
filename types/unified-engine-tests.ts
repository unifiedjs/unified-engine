import * as engine from 'unified-engine'
import * as remark from 'remark'
import {VFile} from 'vfile'
import vfile = require('vfile')
import * as toc from 'remark-toc'

engine(
  {
    processor: remark()
  },
  () => {}
)

engine(
  {
    processor: remark(),
    settings: {gfm: true}
  },
  () => {}
)

engine(
  {
    processor: remark(),
    // $ExpectError
    settings: {notARealSetting: true}
  },
  () => {}
)

interface CustomReporterOptions {
  example: boolean
}
const customReporter = (files: VFile[], options: CustomReporterOptions) =>
  'example'

engine(
  {
    processor: remark(),
    reporter: customReporter
  },
  () => {}
)

engine(
  {
    processor: remark(),
    reporter: customReporter,
    reporterOptions: {example: true}
  },
  () => {}
)

engine(
  {
    processor: remark(),
    reporter: customReporter,
    // $ExpectError
    reporterOptions: {notARealSetting: true}
  },
  () => {}
)

engine(
  {
    processor: remark(),
    reporter: 'vfile-reporter-pretty',
    // settings cannot be inferred
    reporterOptions: {notARealSetting: true}
  },
  () => {}
)

engine(
  {
    processor: remark(),
    output: true
  },
  () => {}
)

engine(
  {
    processor: remark(),
    output: false
  },
  () => {}
)

engine(
  {
    processor: remark(),
    output: '.'
  },
  () => {}
)

engine(
  {
    processor: remark(),
    configTransform: (content: unknown) => ({settings: {commonmark: true}})
  },
  () => {}
)

engine(
  {
    processor: remark(),
    cwd: '~/example',
    files: [vfile('example'), 'example.md'],
    extensions: ['md'],
    streamIn: process.stdin,
    filePath: '~/example.md',
    streamOut: process.stdout,
    streamError: process.stderr,
    out: true,
    output: true,
    alwaysStringify: true,
    tree: false,
    treeIn: false,
    treeOut: false,
    inspect: false,
    rcName: '.examplerc',
    packageField: 'exampleConfig',
    detectConfig: true,
    rcPath: '.',
    settings: {gfm: true},
    ignoreName: '.exampleignore',
    ignorePatterns: ['.hidden'],
    silentlyIgnore: false,
    plugins: toc,
    pluginPrefix: 'example',
    configTransform: () => ({plugins: []}),
    reporter: customReporter,
    reporterOptions: {example: true},
    color: false,
    silent: false,
    quiet: false,
    frail: false
  },
  () => {}
)

engine(
  {
    processor: remark()
  },
  (err, status, context) => {
    if (err || status === 1) {
      console.error('failed with error ', err)
      return
    }

    context.files.forEach((file) => console.log(file.name))
  }
)
