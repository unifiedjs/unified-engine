/* eslint-disable-next-line import/no-extraneous-dependencies */
import * as engine from 'unified-engine'
import * as remark from 'remark'
import {VFile} from 'vfile'
import * as toc from 'remark-toc'

engine(
  {
    processor: remark()
  },
  done
)

engine(
  {
    processor: remark(),
    settings: {strong: '*'}
  },
  done
)

engine(
  {
    processor: remark(),
    // $ExpectError
    settings: {notARealSetting: true}
  },
  done
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
  done
)

engine(
  {
    processor: remark(),
    reporter: customReporter,
    reporterOptions: {example: true}
  },
  done
)

engine(
  {
    processor: remark(),
    reporter: customReporter,
    // $ExpectError
    reporterOptions: {notARealSetting: true}
  },
  done
)

engine(
  {
    processor: remark(),
    reporter: 'vfile-reporter-pretty',
    // Settings cannot be inferred
    reporterOptions: {notARealSetting: true}
  },
  done
)

engine(
  {
    processor: remark(),
    output: true
  },
  done
)

engine(
  {
    processor: remark(),
    output: false
  },
  done
)

engine(
  {
    processor: remark(),
    output: '.'
  },
  done
)

engine(
  {
    processor: remark(),
    configTransform: (content: unknown) => ({settings: {commonmark: true}})
  },
  done
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
    settings: {strong: '*'},
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
  done
)

engine(
  {
    processor: remark()
  },
  (err, status, context) => {
    if (err || status === 1) {
      console.error('failed with error', err)
      return
    }

    context.files.forEach((file) => console.log(file.name))
    context.fileset.valueOf().forEach((file) => console.log(file.name))
  }
)

function done() {
  // Empty.
}
