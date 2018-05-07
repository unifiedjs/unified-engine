'use strict'

var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('`configTransform`', function(t) {
  t.plan(1)

  t.test('should work', function(st) {
    var stderr = spy()

    /* One more in fixture. */
    st.plan(5)

    engine(
      {
        processor: noop().use(addTest),
        streamError: stderr.stream,
        cwd: join(fixtures, 'config-transform'),
        files: ['.'],
        packageField: 'foo',
        configTransform: configTransform,
        extensions: ['txt']
      },
      onrun
    )

    function onrun(err, code, result) {
      var cache = result.configuration.findUp.cache
      var keys = Object.keys(cache)

      st.equal(keys.length, 1, 'should have one cache entry')

      st.deepEqual(
        cache[keys[0]].settings,
        {foxtrot: true},
        'should set the correct settings'
      )

      st.deepEqual(
        cache[keys[0]].plugins[0][1],
        {golf: false},
        'should pass the correct options to plugins'
      )

      st.deepEqual(
        [err, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should succeed'
      )
    }

    function addTest() {
      this.t = st
    }

    function configTransform(raw) {
      return {settings: raw.options, plugins: raw.plugs}
    }
  })
})
