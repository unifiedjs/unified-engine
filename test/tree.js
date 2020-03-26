'use strict'

var fs = require('fs')
var path = require('path')
var PassThrough = require('stream').PassThrough
var test = require('tape')
var vfile = require('to-vfile')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join
var read = fs.readFileSync
var unlink = fs.unlinkSync

var fixtures = join(__dirname, 'fixtures')

test('tree', function (t) {
  t.plan(7)

  t.test('should fail on malformed input', function (st) {
    var cwd = join(fixtures, 'malformed-tree')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        treeIn: true,
        files: ['doc.json']
      },
      onrun
    )

    function onrun(error, code) {
      var actual = stderr().split('\n').slice(0, 2).join('\n')

      st.deepEqual(
        [error, code, actual],
        [null, 1, 'doc.json\n  1:1  error  Error: Cannot read file as JSON'],
        'should report'
      )
    }
  })

  t.test('should read and write JSON when `tree` is given', function (st) {
    var cwd = join(fixtures, 'tree')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(plugin),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        tree: true,
        files: ['doc']
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'doc.json'), 'utf8')

      unlink(join(cwd, 'doc.json'))

      st.deepEqual(
        [error, code, doc, stderr()],
        [
          null,
          0,
          '{\n  "type": "text",\n  "value": "two"\n}\n',
          'doc > doc.json: written\n'
        ],
        'should report'
      )
    }

    function plugin() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should read JSON when `treeIn` is given', function (st) {
    var cwd = join(fixtures, 'tree')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(plugin),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        treeIn: true,
        files: ['doc'],
        extensions: ['foo']
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'doc.foo'), 'utf8')

      unlink(join(cwd, 'doc.foo'))

      st.deepEqual(
        [error, code, doc, stderr()],
        [null, 0, 'two', 'doc > doc.foo: written\n'],
        'should report'
      )
    }

    function plugin() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should write JSON when `treeOut` is given', function (st) {
    var cwd = join(fixtures, 'one-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop().use(plugin),
        cwd: cwd,
        streamError: stderr.stream,
        output: true,
        treeOut: true,
        files: ['.'],
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error, code) {
      var doc = read(join(cwd, 'one.json'), 'utf8')

      unlink(join(cwd, 'one.json'))

      st.deepEqual(
        [error, code, doc, stderr()],
        [
          null,
          0,
          '{\n  "type": "text",\n  "value": "two"\n}\n',
          'one.txt > one.json: written\n'
        ],
        'should report'
      )
    }

    function plugin() {
      return transformer
    }

    function transformer(tree) {
      tree.value = 'two'
    }
  })

  t.test('should support `treeOut` for stdin', function (st) {
    var stdin = new PassThrough()
    var stdout = spy()
    var stderr = spy()

    setTimeout(send, 50)

    st.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeOut: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [
          null,
          0,
          '{\n  "type": "text",\n  "value": "\\n"\n}\n',
          '<stdin>: no issues found\n'
        ],
        'should work'
      )
    }

    function send() {
      stdin.end('\n')
    }
  })

  t.test('should support `treeIn` for stdin', function (st) {
    var stdin = new PassThrough()
    var stdout = spy()
    var stderr = spy()

    setTimeout(send, 50)

    st.plan(1)

    engine(
      {
        processor: noop,
        streamIn: stdin,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        treeIn: true
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '\n', '<stdin>: no issues found\n'],
        'should work'
      )
    }

    function send() {
      stdin.end('{"type":"text","value":"\\n"}')
    }
  })

  t.test('should write injected files', function (st) {
    var cwd = join(fixtures, 'one-file')
    var stderr = spy()

    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: cwd,
        streamError: stderr.stream,
        output: 'bar.json',
        treeOut: true,
        files: [vfile(join(cwd, 'one.txt'))]
      },
      onrun
    )

    function onrun(error, code) {
      unlink(join(cwd, 'bar.json'))

      st.deepEqual(
        [error, code, stderr()],
        [null, 0, 'one.txt > bar.json: written\n'],
        'should work'
      )
    }
  })
})
