import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('`defaultConfig`', (t) => {
  t.plan(2)

  const defaultConfig = {
    settings: {alpha: true},
    plugins: {'./test-defaults.js': {bravo: false}}
  }

  t.test('should use default config if no config file is found', (t) => {
    const stderr = spy()

    t.plan(3)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: path.join(fixtures, 'config-default'),
        files: ['.'],
        packageField: 'bar',
        extensions: ['txt'],
        defaultConfig
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )

    function addTest() {
      // Used in test.
      // type-coverage:ignore-next-line
      this.t = t
    }
  })

  t.test('should use found otherwise', (t) => {
    const stderr = spy()

    t.plan(3)

    engine(
      {
        // @ts-expect-error: unified types are wrong.
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: path.join(fixtures, 'config-default'),
        files: ['.'],
        packageField: 'foo',
        extensions: ['txt'],
        defaultConfig
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should work'
        )
      }
    )

    function addTest() {
      // Used in test.
      // type-coverage:ignore-next-line
      this.t = t
    }
  })
})
