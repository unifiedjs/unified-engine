'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var vfile = require('to-vfile')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join
var read = fs.readFileSync
var unlink = fs.unlinkSync
var exists = fs.existsSync
var sep = path.sep

var fixtures = join(__dirname, 'fixtures')

test('output', function(t) {
  t.plan(13)

  t.test('should not write to stdout on dirs', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stdout = spy()
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to stdout on one file', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stdout = spy()
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, 'two', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write to stdout without `out`', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stdout = spy()
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        streamOut: stdout.stream,
        out: false,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write multiple files to stdout', function(st) {
    var cwd = join(fixtures, 'two-files')
    var stdout = spy()
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        cwd: cwd,
        out: false,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', 'one.txt: no issues found\ntwo.txt: no issues found\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should output files', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'one.txt'), 'utf8')

      fs.truncateSync(join(cwd, 'one.txt'))

      st.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, 'two', 'one.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to a path', function(st) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        output: 'four.txt',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8')
      var output = read(join(cwd, 'four.txt'), 'utf8')

      unlink(join(cwd, 'four.txt'))

      st.deepEqual(
        [error, code, input, output, stderr()],
        [null, 0, '', 'two', 'one.txt > four.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write to directories', function(st) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        output: 'nested/',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var input = read(join(cwd, 'one.txt'), 'utf8')
      var output = read(join(cwd, 'nested', 'one.txt'), 'utf8')

      unlink(join(cwd, 'nested', 'one.txt'))

      st.deepEqual(
        [error, code, input, output, stderr()],
        [null, 0, '', 'two', 'one.txt > nested' + sep + 'one.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not create intermediate directories', function(st) {
    var cwd = join(fixtures, 'simple-structure')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop(),
        cwd: cwd,
        streamError: stderr.stream,
        output: 'missing/bar',
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 3)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read parent directory. Error:',
        "ENOENT: no such file or directory, stat '" + join(cwd, 'missing') + "'"
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should write injected files', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        files: [vfile(join(cwd, 'one.txt'))]
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'one.txt'), 'utf8')

      fs.truncateSync(join(cwd, 'one.txt'))

      st.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, 'two', 'one.txt: written\n'],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should not write without file-path', function(st) {
    var cwd = join(fixtures, 'one-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(change),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        files: ['one.txt'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'one.txt'), 'utf8')

      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        '<stdin>',
        '  1:1  error  Error: Cannot write file without an output path'
      ].join('\n')

      st.deepEqual(
        [error, code, doc, actual],
        [null, 1, '', expected],
        'should report'
      )
    }

    function change() {
      return transformer
    }

    function transformer(tree, file) {
      tree.value = 'two'
      file.history = []
    }
  })

  t.test('should fail when writing files to one path', function(st) {
    var cwd = join(fixtures, 'two-files')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        output: 'three.txt',
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 2)

      actual[1] = actual[1]
        .split(':')
        .slice(0, 3)
        .join(':')

      actual = actual.join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot write multiple files to single output'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test('should fail when writing to non-existent dirs', function(st) {
    var cwd = join(fixtures, 'two-files')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        output: 'three' + path.sep,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr()
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'one.txt',
        '  1:1  error  Error: Cannot read output directory. Error:'
      ].join('\n')

      st.deepEqual([error, code, actual], [null, 1, expected], 'should report')
    }
  })

  t.test(
    'should not create a new file when input file does not exist',
    function(st) {
      var cwd = join(fixtures, 'empty')
      var targetFile = join(cwd, 'one.txt')
      var stderr = spy()

      st.plan(2)

      engine(
        {
          processor: noop(),
          cwd: cwd,
          streamError: stderr.stream,
          output: true,
          files: ['one.txt'],
          extensions: ['txt']
        },
        onrun
      )

      function onrun(err, code) {
        var actual = stderr()
          .split('\n')
          .slice(0, 2)
          .join('\n')

        var expected = [
          'one.txt',
          '  1:1  error  No such file or directory'
        ].join('\n')

        st.deepEqual([err, code, actual], [null, 1, expected], 'should report')

        st.notOk(exists(targetFile))
      }
    }
  )
})
