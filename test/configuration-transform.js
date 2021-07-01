import path from 'path'
import test from 'tape'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'
import {engine} from '../index.js'

const fixtures = path.join('test', 'fixtures')

test('`configTransform`', (t) => {
  t.plan(1)

  t.test('should work', (t) => {
    const stderr = spy()

    // One more in fixture.
    t.plan(5)

    engine(
      {
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: path.join(fixtures, 'config-transform'),
        files: ['.'],
        packageField: 'foo',
        configTransform,
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code, result) {
      const cache = result.configuration.findUp.cache
      const keys = Object.keys(cache)

      t.equal(keys.length, 1, 'should have one cache entry')

      t.deepEqual(
        cache[keys[0]].settings,
        {foxtrot: true},
        'should set the correct settings'
      )

      t.deepEqual(
        cache[keys[0]].plugins[0][1],
        {golf: false},
        'should pass the correct options to plugins'
      )

      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = t
    }

    function configTransform(raw) {
      return {settings: raw.options, plugins: raw.plugs}
    }
  })
})
