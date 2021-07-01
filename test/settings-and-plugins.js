import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('settings', (t) => {
  t.plan(2)

  t.test('should use `settings`', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        settings: {alpha: true}
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function attacher() {
      t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')

      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })

  t.test('should cascade `settings`', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(attacher),
        cwd: path.join(fixtures, 'config-settings-cascade'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        rcName: '.foorc',
        settings: {alpha: false, bravo: 'charlie'}
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function attacher() {
      t.deepEqual(
        this.data('settings'),
        {alpha: false, bravo: 'charlie', delta: 1},
        'should configure'
      )

      this.Parser = parser
    }

    function parser(doc) {
      return {type: 'text', value: doc}
    }
  })
})

test('plugins', (t) => {
  t.plan(3)

  t.test('should use `plugins` as list of functions', (t) => {
    const stderr = spy()

    t.plan(3)

    engine(
      {
        processor: noop,
        cwd: path.join(fixtures, 'one-file'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: [one, [two, {alpha: true}]]
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function one() {
      return transformerOne
    }

    function transformerOne() {
      t.pass('transformer')
    }

    function two(options) {
      return transformerTwo

      function transformerTwo() {
        t.deepEqual(options, {alpha: true}, 'transformer')
      }
    }
  })

  t.test('should use `plugins` as list of strings', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: path.join(fixtures, 'config-plugins-basic-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: ['./preset', ['./preset/plugin', {two: false, three: true}]]
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function addTest() {
      this.t = t
    }
  })

  t.test('should use `plugins` as list of objects', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(addTest),
        cwd: path.join(fixtures, 'config-plugins-basic-reconfigure'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        plugins: {
          './preset': null,
          './preset/plugin': {two: false, three: true}
        }
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function addTest() {
      this.t = t
    }
  })
})
