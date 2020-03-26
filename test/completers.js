'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join
var sep = path.sep
var read = fs.readFileSync
var unlink = fs.unlinkSync

var fixtures = join(__dirname, 'fixtures')

test('completers', function (t) {
  t.plan(2)

  t.test('should pass `fileSet` to plugins', function (t) {
    var stderr = spy()

    otherCompleter.pluginId = 'foo'

    // 5 in the attacher, which is invoked 2 times, 1 in `checkSet`, which is
    // invoked 2 times, 1 in the callback.
    t.plan(13)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        plugins: [checkCompleter],
        cwd: join(fixtures, 'two-files'),
        files: ['one.txt']
      },
      onrun
    )

    function onrun(error, code) {
      t.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt: no issues found\n'],
        'should work'
      )
    }

    function checkCompleter(settings, set) {
      t.equal(typeof set, 'object', 'should pass a set')
      t.equal(typeof set.use, 'function', 'should have a `use` method')
      t.equal(typeof set.add, 'function', 'should have an `add` method')

      // The completer is added multiple times, but it’s detected that its the
      // same function so it runs once.
      t.equal(set.use(completer), set, 'should be able to `use` a completer')

      set.use(otherCompleter)

      // First, this plugin is attached for `one.txt`, where it adds `two.txt`.
      // Then, this plugin is attached for `two.txt`, but it does not re-add
      // `two.txt` as it’s already added.
      t.equal(set.add('two.txt'), set, 'should be able to `add` a file')
    }

    // Most often, completers cannot be detected to be the same because they are
    // created inside attachers.
    // `pluginId` can be used for those to ensure the completer runs once.
    function otherCompleter(set) {
      checkSet(set, 2)
    }

    function completer(set) {
      checkSet(set, 1)
    }

    function checkSet(set, nr) {
      var paths = set.files.map(path)

      t.deepEqual(
        paths,
        ['one.txt', 'two.txt'],
        'should expose the files and set to `completer` (' + nr + ')'
      )
    }

    function path(file) {
      return file.path
    }
  })

  t.test('should pass `fileSet` to plugins', function (t) {
    var cwd = join(fixtures, 'extensions')
    var stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        plugins: [
          function (settings, set) {
            set.add('bar.text')
          }
        ],
        cwd: cwd,
        files: ['foo.txt'],
        output: 'nested/'
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'nested', 'foo.txt'), 'utf8')

      unlink(join(cwd, 'nested', 'foo.txt'))

      t.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, '', 'foo.txt > nested' + sep + 'foo.txt: written\n'],
        'should work'
      )
    }
  })
})
