'use strict'

var path = require('path')
var PassThrough = require('stream').PassThrough
var test = require('tape')
var noop = require('./util/noop-processor')
var spy = require('./util/spy')
var engine = require('..')

var join = path.join

var fixtures = join(__dirname, 'fixtures')

test('stdin', function(t) {
  t.plan(3)

  t.test('should support stdin', function(st) {
    var stdout = spy()
    var stderr = spy()
    var stream = new PassThrough()
    var index = 0

    st.plan(1)

    send()

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'empty'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream
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
          '<stdin>: no issues found\n'
        ],
        'should report'
      )
    }

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  t.test('should not output if `out: false`', function(st) {
    var stdout = spy()
    var stderr = spy()
    var stream = new PassThrough()
    var index = 0

    st.plan(1)

    send()

    engine(
      {
        processor: noop,
        cwd: join(fixtures, 'empty'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        out: false
      },
      onrun
    )

    function onrun(error, code) {
      st.deepEqual(
        [error, code, stdout(), stderr()],
        [null, 0, '', '<stdin>: no issues found\n'],
        'should report'
      )
    }

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }
  })

  t.test('should support config files on stdin', function(st) {
    var stdout = spy()
    var stderr = spy()
    var stream = new PassThrough()
    var index = 0

    st.plan(2)

    send()

    engine(
      {
        processor: noop().use(plugin),
        cwd: join(fixtures, 'config-settings'),
        streamIn: stream,
        streamOut: stdout.stream,
        streamError: stderr.stream,
        packageField: 'fooConfig',
        rcName: '.foorc'
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
          '<stdin>: no issues found\n'
        ],
        'should work'
      )
    }

    function send() {
      if (++index > 10) {
        stream.end()
      } else {
        stream.write(index + '\n')
        setTimeout(send, 10)
      }
    }

    function plugin() {
      st.deepEqual(this.data('settings'), {alpha: true}, 'should configure')
    }
  })
})
