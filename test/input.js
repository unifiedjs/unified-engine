'use strict'

var path = require('path')
var PassThrough = require('stream').PassThrough
var test = require('tape')
var unified = require('unified')
var vfile = require('to-vfile')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('input', function(t) {
  t.plan(19)

  t.test('should fail without input', function(st) {
    var stream = new PassThrough()

    st.plan(1)

    /* Spoof stdin(4). */
    stream.isTTY = true

    engine({processor: unified, streamIn: stream}, onrun)

    stream.end()

    function onrun(error) {
      st.equal(error.message, 'No input', 'should fail')
    }
  })

  t.test('should not fail on empty input stream', function(st) {
    var stderr = spy()
    var stream = new PassThrough()

    st.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stream,
        streamError: stderr.stream
      },
      onrun
    )

    stream.end('')

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, '<stdin>: no issues found\n'],
        'should report'
      )
    }
  })

  t.test('should not fail on unmatched given globs', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: unified,
        cwd: join(fixtures, 'empty'),
        streamError: stderr.stream,
        files: ['.']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual([error, code, stderr()], [null, 0, ''], 'should work')
    }
  })

  t.test('should report unfound given files', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: unified,
        cwd: join(fixtures, 'empty'),
        streamError: stderr.stream,
        files: ['readme.md']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'readme.md',
        '  1:1  error  No such file or directory',
        '',
        '✖ 1 error',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 1, expected],
        'should report'
      )
    }
  })

  t.test('should not report unfound given directories', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: unified,
        cwd: join(fixtures, 'directory'),
        streamError: stderr.stream,
        files: ['empty/']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual([error, code, stderr()], [null, 0, ''])
    }
  })

  t.test('should search for extensions', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'extensions'),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt', '.text']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'bar.text: no issues found',
        'foo.txt: no issues found',
        'nested/quux.text: no issues found',
        'nested/qux.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search a directory for extensions', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'extensions'),
        streamError: stderr.stream,
        files: ['nested'],
        extensions: ['txt', 'text']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/quux.text: no issues found',
        'nested/qux.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search for globs matching files (#1)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['*/*.+(txt|text)'],
        extensions: []
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/no-3.txt: no issues found',
        'nested/no-4.text: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search for globs matching files (#2)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['*/*.txt', '*/*.text'],
        extensions: []
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/no-3.txt: no issues found',
        'nested/no-4.text: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search for globs matching dirs', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'globs'),
        streamError: stderr.stream,
        files: ['**/nested'],
        extensions: []
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/no-3.txt: no issues found',
        'nested/no-4.text: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search vfile’s pointing to directories', function(st) {
    var cwd = join(fixtures, 'ignore-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [vfile(join(cwd, 'nested'))]
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'nested/three.txt: no issues found\n'],
        'should report'
      )
    }
  })

  t.test('should not ignore implicitly ignored files in globs', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'globs-ignore'),
        streamError: stderr.stream,
        files: ['**/*.txt'],
        extensions: []
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/node_modules/ignore-two.txt: no issues found',
        'nested/two.txt: no issues found',
        'node_modules/ignore-one.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should include given ignored files (#1)', function(st) {
    var cwd = join(fixtures, 'ignore-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [
          vfile(join(cwd, 'one.txt')),
          vfile(join(cwd, 'nested', 'two.txt')),
          vfile(join(cwd, 'nested', 'three.txt'))
        ]
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/three.txt: no issues found',
        'nested/two.txt',
        '  1:1  error  Cannot process specified file: it’s ignored',
        '',
        'one.txt: no issues found',
        '',
        '✖ 1 error',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 1, expected],
        'should report'
      )
    }
  })

  t.test('should not atempt to read files with `contents` (1)', function(st) {
    var stderr = spy()
    var cwd = join(fixtures, 'ignore-file')
    var file = vfile({path: join(cwd, 'not-existing.txt'), contents: 'foo'})

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [file]
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'not-existing.txt',
        '  1:1  error  Cannot process specified file: it’s ignored',
        '',
        '✖ 1 error',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 1, expected],
        'should report'
      )
    }
  })

  t.test('should not atempt to read files with `contents` (2)', function(st) {
    var stderr = spy()
    var cwd = join(fixtures, 'ignore-file')
    var file = vfile({path: join(cwd, 'not-existing-2.txt'), contents: 'foo'})

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: [file]
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'not-existing-2.txt: no issues found\n'],
        'should report'
      )
    }
  })

  t.test('should include given ignored files (#2)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'ignore-file'),
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: ['**/*.txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/three.txt: no issues found',
        'nested/two.txt',
        '  1:1  error  Cannot process specified file: it’s ignored',
        '',
        'one.txt: no issues found',
        '',
        '✖ 1 error',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 1, expected],
        'should report'
      )
    }
  })

  t.test('silentlyIgnore: skip detected ignored files (#1)', function(st) {
    var cwd = join(fixtures, 'ignore-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        silentlyIgnore: true,
        files: [
          vfile(join(cwd, 'one.txt')),
          vfile(join(cwd, 'nested', 'two.txt')),
          vfile(join(cwd, 'nested', 'three.txt'))
        ]
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/three.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('silentlyIgnore: skip detected ignored files (#2)', function(st) {
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'ignore-file'),
        silentlyIgnore: true,
        streamError: stderr.stream,
        ignoreName: '.fooignore',
        files: ['**/*.txt']
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/three.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })

  t.test('should search if given files', function(st) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        extensions: ['txt'],
        files: ['nested', vfile(join(cwd, 'one.txt'))]
      },
      onrun
    )

    function onrun(error, code) {
      var expected = [
        'nested/three.txt: no issues found',
        'nested/two.txt: no issues found',
        'one.txt: no issues found',
        ''
      ].join('\n')

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, expected],
        'should report'
      )
    }
  })
})
