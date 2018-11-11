'use strict'

var path = require('path')
var PassThrough = require('stream').PassThrough
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('file-path', function(t) {
  t.plan(2)

  t.test('should throw on `file-path` with files', function(st) {
    st.plan(1)

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'simple-structure'),
        files: ['.'],
        filePath: 'qux/quux.foo',
        extensions: ['txt']
      },
      onrun
    )

    function onrun(error) {
      var actual = error.message
        .split('\n')
        .slice(0, 2)
        .join('\n')

      var expected = [
        'Do not pass both `--file-path` and real files.',
        'Did you mean to pass stdin instead of files?'
      ].join('\n')

      st.equal(actual, expected, 'should fail')
    }
  })

  t.test('should support `file-path`', function(st) {
    var stdout = spy()
    var stderr = spy()
    var stream = new PassThrough()
    var index = 0

    st.plan(1)

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }

    send()

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'empty'),
        streamOut: stdout.stream,
        streamError: stderr.stream,
        streamIn: stream,
        filePath: 'foo/bar.baz'
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [
          null,
          0,
          '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
          'foo/bar.baz: no issues found\n'
        ],
        'should report'
      )
    }
  })
})
