/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified-engine
 * @fileoverview Test suite for `unified-engine`.
 */

'use strict';

/* eslint-env node */
/* jscs:disable jsDoc */

/* Dependencies. */
var fs = require('fs');
var path = require('path');
var PassThrough = require('stream').PassThrough;
var test = require('tape');
var unified = require('unified');
var toVFile = require('to-vfile');
var engine = require('..');

/* Methods. */
var read = fs.readFileSync;
var unlink = fs.unlinkSync;
var join = path.join;

/* Constants. */
var fixtures = join(__dirname, 'fixtures');

/* Processor. */
var noop = unified()
    .use(function (processor) {
        processor.Parser = function (file) {
            this.value = file.toString();
        };

        processor.Parser.prototype.parse = function () {
            return {
                'type': 'text',
                'value': this.value
            };
        };
    })
    .use(function (processor) {
        processor.Compiler = function () {};

        processor.Compiler.prototype.compile = function (tree) {
            return tree.value;
        };
    });

/**
 * Create a stream to spy on.
 */
function spy() {
    var stream = new PassThrough();
    var output = [];
    var write;

    write = stream.write;

    stream.write = function (chunk, encoding, callback) {
        callback = typeof encoding === 'function' ? encoding : callback;

        if (typeof callback === 'function') {
            setImmediate(callback);
        }

        output.push(chunk);
    };

    function done() {
        stream.write = write;

        return output.join('');
    }

    done.stream = stream;

    return done;
}

/*
 * Tests.
 */

test('engine', function (t) {
    t.plan(19);

    t.throws(
        function () {
            engine();
        },
        /Missing `callback`/,
        'should throw without `callback`'
    );

    engine(null, function (err) {
        t.equal(
            err.message,
            'Missing `processor`',
            'should fail when without options'
        );
    });

    engine({}, function (err) {
        t.equal(
            err.message,
            'Missing `processor`',
            'should fail when without processor'
        );
    });

    t.test('should fail when with `output` and `out`', function (st) {
        st.plan(1);

        engine({
            'processor': unified,
            'output': true,
            'out': true
        }, function (err) {
            st.equal(
                err.message,
                'Cannot accept both `output` and `out`',
                'should fail'
            );
        });
    });

    t.test('should fail when with `files` and `ignoreName`', function (st) {
        st.plan(1);

        engine({
            'processor': unified,
            'files': [
                toVFile(join(fixtures, 'one-file', 'one.txt'))
            ],
            'ignoreName': '.fooignore'
        }, function (err) {
            st.equal(
                err.message,
                'Cannot accept both `files` and `ignoreName`',
                'should fail'
            );
        });
    });

    t.test('should fail when with `files` and `globs`', function (st) {
        st.plan(1);

        engine({
            'processor': unified,
            'files': [
                toVFile(join(fixtures, 'one-file', 'one.txt'))
            ],
            'globs': ['.']
        }, function (err) {
            st.equal(
                err.message,
                'Cannot accept both `files` and `globs`',
                'should fail'
            );
        });
    });

    t.test(
        'should fail when with `files` and `streamIn`',
        function (st) {
            st.plan(1);

            engine({
                'processor': unified,
                'files': [
                    toVFile(join(fixtures, 'one-file', 'one.txt'))
                ],
                'streamIn': new PassThrough()
            }, function (err) {
                st.equal(
                    err.message,
                    'Cannot accept both `files` and `streamIn`',
                    'should fail'
                );
            });
        }
    );

    t.test(
        'should fail when with `detectConfig` and without `rcName`',
        function (st) {
            st.plan(1);

            engine({
                'processor': unified,
                'detectConfig': true
            }, function (err) {
                st.equal(
                    err.message,
                    'Missing `rcName` or `packageField` with `detectConfig`',
                    'should fail'
                );
            });
        }
    );

    t.test(
        'should fail when with `detectIgnore` and without `ignoreName`',
        function (st) {
            st.plan(1);

            engine({
                'processor': unified,
                'detectIgnore': true
            }, function (err) {
                st.equal(
                    err.message,
                    'Missing `ignoreName` with `detectIgnore`',
                    'should fail'
                );
            });
        }
    );

    t.test('input', function (st) {
        st.plan(10);

        st.test('should fail without input', function (sst) {
            var stream = new PassThrough();

            sst.plan(1);

            /* Spoof stdin(4). */
            stream.isTTY = true;

            engine({
                'processor': unified,
                'streamIn': stream
            }, function (err) {
                sst.equal(
                    err.message,
                    'No input',
                    'should fail'
                );
            });

            stream.end();
        });

        st.test('should report unfound given files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': unified,
                'cwd': join(fixtures, 'empty'),
                'streamError': stderr.stream,
                'globs': ['readme.md']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr(),
                    [
                        'readme.md',
                        '        1:1  error    No such file or directory',
                        '',
                        '✖ 1 error',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should report unfound given directories', function (sst) {
            sst.plan(1);

            engine({
                'processor': unified,
                'cwd': join(fixtures, 'directory'),
                'globs': ['empty/']
            }, function (err) {
                sst.equal(
                    err.message,
                    'No input',
                    'should fail fatally when with an empty directory'
                );
            });
        });

        st.test('should search for extensions', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'extensions'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'extensions': ['txt', '.text']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(true),
                    [
                        'bar.text: no issues found',
                        'foo.txt: no issues found',
                        'nested/quux.text: no issues found',
                        'nested/qux.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should search a directory for extensions', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'extensions'),
                'streamError': stderr.stream,
                'globs': ['nested'],
                'extensions': ['txt', 'text']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/quux.text: no issues found',
                        'nested/qux.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should search for globs matching files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'globs'),
                'streamError': stderr.stream,
                'globs': ['*/*.+(txt|text)'],
                'extensions': []
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/no-3.txt: no issues found',
                        'nested/no-4.text: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should search for globs matching dirs', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'globs'),
                'streamError': stderr.stream,
                'globs': ['**/nested'],
                'extensions': []
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/no-3.txt: no issues found',
                        'nested/no-4.text: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should ignore ignored files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'globs-ignore'),
                'streamError': stderr.stream,
                'globs': ['**/*.txt'],
                'extensions': []
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/two.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should include given ignored files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'globs-ignore'),
                'streamError': stderr.stream,
                'globs': ['node_modules/ignore-one.txt', '.'],
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr(),
                    [
                        'nested/two.txt: no issues found',
                        '',
                        'node_modules/ignore-one.txt',
                        '        1:1  error    Cannot process ' +
                            'specified file: it’s ignored',
                        '',
                        'one.txt: no issues found',
                        '',
                        '✖ 1 error',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should not search if given files', function (sst) {
            var cwd = join(fixtures, 'simple-structure');
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': cwd,
                'streamError': stderr.stream,
                'files': [
                    toVFile(join(cwd, 'one.txt')),
                    toVFile(join(cwd, 'nested', 'two.txt'))
                ]
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'one.txt: no issues found',
                        'nested/two.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });
    });

    t.test('ignore', function (st) {
        st.plan(6);

        engine({
            'processor': noop,
            'cwd': join(fixtures, 'empty'),
            'globs': ['.'],
            'detectIgnore': false,
            'ignorePath': '.missing-ignore',
            'extensions': ['txt']
        }, function (err) {
            st.equal(
                err.message.slice(0, err.message.indexOf(':')),
                'Cannot read ignore file',
                'should fail fatally when custom ignore files ' +
                'are not found'
            );
        });

        st.test('should support custom ignore files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'ignore-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'detectIgnore': false,
                'ignorePath': '.fooignore',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/three.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should support searching ignore files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'ignore-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'detectIgnore': true,
                'ignoreName': '.fooignore',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/three.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should not look into hidden files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'hidden-directory'),
                'streamError': stderr.stream,
                'globs': ['.'],
                // no `ignoreName`
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should look into negated hidden files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'hidden-directory'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'detectIgnore': true,
                'ignoreName': '.fooignore',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        '.hidden/two.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should support no ignore files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'simple-structure'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'detectIgnore': true,
                'ignoreName': '.fooignore',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/three.txt: no issues found',
                        'nested/two.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });
    });

    t.test('configuration', function (st) {
        st.plan(15);

        engine({
            'processor': noop,
            'cwd': join(fixtures, 'empty'),
            'globs': ['.'],
            'rcPath': '.foorc',
            'extensions': ['txt']
        }, function (err) {
            st.equal(
                err.message.slice(0, err.message.indexOf(':')),
                'Cannot read configuration file',
                'should fail fatally when custom .rc files ' +
                'are not found'
            );
        });

        engine({
            'processor': noop,
            'cwd': join(fixtures, 'malformed-rc'),
            'globs': ['.'],
            'rcPath': '.foorc',
            'extensions': ['txt']
        }, function (err) {
            st.equal(
                err.message.slice(0, err.message.indexOf(':')),
                'Cannot read configuration file',
                'should fail fatally when custom .rc files ' +
                'are malformed'
            );
        });

        st.test('should support `.rc.js` modules', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'malformed-rc-module'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'rcName': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                var report = stderr().split('\n').slice(0, 2).join('\n');
                report = report.slice(0, report.lastIndexOf(':'))
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    report,
                    [
                        'one.txt',
                        '        1:1  error    Error: Cannot read ' +
                            'configuration file'
                    ].join('\n'),
                    'should fail fatally when custom .rc files ' +
                    'are malformed'
                );
            });
        });

        st.test('should support custom rc files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'rc-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'rcPath': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/four.txt: no issues found',
                        'nested/three.txt: no issues found',
                        'one.txt: no issues found',
                        'two.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should support searching package files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'malformed-package-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'extensions': ['txt']
            }, function (err, code) {
                var report = stderr().split('\n').slice(0, 2);

                report[1] = report[1].slice(0, report[1].lastIndexOf(':'))

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    report.join('\n'),
                    [
                        'one.txt',
                        '        1:1  error    SyntaxError: Cannot ' +
                            'read configuration file'
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should support custom rc files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'rc-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'rcName': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/four.txt: no issues found',
                        'nested/three.txt: no issues found',
                        'one.txt: no issues found',
                        'two.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should support no config files', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'simple-structure'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'rcName': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    [
                        'nested/three.txt: no issues found',
                        'nested/two.txt: no issues found',
                        'one.txt: no issues found',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test(
            'should not search if `detectConfig` is `false`',
            function (sst) {
                var stderr = spy();

                sst.plan(3);

                engine({
                    'processor': noop,
                    'cwd': join(fixtures, 'malformed-rc-module'),
                    'streamError': stderr.stream,
                    'globs': ['.'],
                    'extensions': ['txt'],
                    'detectConfig': false,
                    'rcName': '.foorc'
                }, function (err, code) {
                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 0, 'should exit with `0`');

                    sst.equal(
                        stderr(),
                        'one.txt: no issues found\n',
                        'should not search for configuration of ' +
                        '`detectConfig` is set to `false`'
                    );
                });
            }
        );

        st.test('should cascade `settings`', function (sst) {
            var stderr = spy();

            sst.plan(4);

            function Parser(file, options) {
                sst.deepEqual(
                    options,
                    {
                        'rc': true,
                        'module': true,
                        'package': true,
                        'nested-rc': true,
                        'nested-module': true,
                        'nested-package': true,
                        'cascade': 4 // `.rc` precedes over `.rc.js`,
                        // in turn over `package.json`.
                    },
                    'should correctly cascade settings'
                );

                this.value = file.toString();
            }

            Parser.prototype.parse = function () {
                return {
                    'type': 'text',
                    'value': this.value
                };
            };

            engine({
                'processor': noop().use(function (processor) {
                    processor.Parser = Parser;
                }),
                'cwd': join(fixtures, 'config-settings-cascade'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'rcName': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'nested/one.txt: no issues found\n',
                    'should report'
                );
            });
        });

        st.test('should cascade `plugins`', function (sst) {
            var stderr = spy();

            // More assertions are in loaded plugins.
            sst.plan(7);

            engine({
                'processor': noop.use(function (processor) {
                    processor.t = sst;
                }),
                'cwd': join(fixtures, 'config-plugins-cascade'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'rcName': '.foorc',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'nested/one.txt: no issues found\n',
                    'should report'
                );
            });
        });

        st.test('should handle failing plugins', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'malformed-plugin'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr().split('\n').slice(0, 2).join('\n'),
                    [
                        'one.txt',
                        '        1:1  error    Error: Boom!'
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should handle missing plugins', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'missing-plugin'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr().split('\n').slice(0, 2).join('\n'),
                    [
                        'one.txt',
                        '        1:1  error    Error: Cannot find ' +
                            'module \'missing\''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should handle invalid plugins', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'not-a-plugin'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr().split('\n').slice(0, 2).join('\n'),
                    [
                        'one.txt',
                        '        1:1  error    Error: Loading `test` ' +
                            'should give a function, not `[object ' +
                            'Object]`'
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should handle throwing plugins', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'throwing-plugin'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'packageField': 'fooConfig',
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr().split('\n').slice(0, 2).join('\n'),
                    [
                        'one.txt',
                        '        1:1  error    Error: Missing `required`'
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test('should handle injected plugins', function (sst) {
            var stderr = spy();

            sst.plan(5);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'one-file'),
                'streamError': stderr.stream,
                'globs': ['.'],
                'injectedPlugins': [
                    function (processor, options) {
                        sst.equal(
                            options,
                            undefined,
                            'should support a plug-in'
                        );
                    },
                    [
                        function (processor, options) {
                            sst.deepEqual(
                                options,
                                {
                                    'foo': 'bar'
                                },
                                'should support a plug-in--options tuple'
                            );
                        },
                        {
                            'foo': 'bar'
                        }
                    ]
                ],
                'extensions': ['txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'one.txt: no issues found\n',
                    'should report'
                );
            });
        });
    });

    t.test('stdin', function (st) {
        st.plan(1);

        st.test('should support stdin', function (sst) {
            var stdout = spy();
            var stderr = spy();
            var stream = new PassThrough();
            var index = 0;

            sst.plan(4);

            function send() {
                if (++index > 10) {
                    stream.end();
                } else {
                    stream.write(index + '\n');
                    setTimeout(send, 10);
                }
            }

            send();

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'empty'),
                'streamOut': stdout.stream,
                'streamError': stderr.stream,
                'globs': [],
                'streamIn': stream
            }, function (err, code) {
                sst.equal(
                    stdout(),
                    '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n',
                    'should report'
                );

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    '<stdin>: no issues found\n',
                    'should report'
                );
            });
        });
    });

    t.test('output', function (st) {
        st.plan(10);

        st.test('should write one file to stdout', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stdout = spy();
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamOut': stdout.stream,
                'streamError': stderr.stream,
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                sst.equal(stdout(), 'two\n', 'should write');
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'one.txt: no issues found\n',
                    'should report'
                );
            });
        });

        st.test('should not write to stdout without `out`', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stdout = spy();
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'streamOut': stdout.stream,
                'out': false,
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                sst.equal(stdout(), '', 'should not write');
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'one.txt: no issues found\n',
                    'should report'
                );
            });
        });

        st.test('should not write multiple files to stdout', function (sst) {
            var cwd = join(fixtures, 'two-files');
            var stdout = spy();
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'streamOut': stdout.stream,
                'streamError': stderr.stream,
                'cwd': cwd,
                'out': false,
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                sst.equal(stdout(), '', 'should not write');
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'one.txt: no issues found\n' +
                    'two.txt: no issues found\n',
                    'should report'
                );
            });
        });

        st.test('should output files', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': true,
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                var doc = read(join(cwd, 'one.txt'), 'utf8');

                /* Reset the file. */
                fs.truncateSync(join(cwd, 'one.txt'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'one.txt: written\n',
                    'should report'
                );

                sst.equal(doc, 'two\n', 'should write the transformed doc');
            });
        });

        st.test('should write to a path', function (sst) {
            var cwd = join(fixtures, 'simple-structure');
            var stderr = spy();

            sst.plan(5);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': 'four.txt',
                'globs': ['one.txt'],
                'extensions': ['txt']
            }, function (err, code) {
                var input = read(join(cwd, 'one.txt'), 'utf8');
                var output = read(join(cwd, 'four.txt'), 'utf8');

                /* Remove the file. */
                unlink(join(cwd, 'four.txt'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(true),
                    'one.txt > four.txt: written\n',
                    'should report'
                );

                sst.equal(input, '', 'should not modify the input');
                sst.equal(output, 'two\n', 'should write the transformed doc');
            });
        });

        st.test('should write to directories', function (sst) {
            var cwd = join(fixtures, 'simple-structure');
            var stderr = spy();

            sst.plan(5);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': 'nested/',
                'globs': ['one.txt'],
                'extensions': ['txt']
            }, function (err, code) {
                var input = read(join(cwd, 'one.txt'), 'utf8');
                var output = read(join(cwd, 'nested', 'one.txt'), 'utf8');

                /* Remove the file. */
                unlink(join(cwd, 'nested', 'one.txt'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(true),
                    'one.txt > nested/one.txt: written\n',
                    'should report'
                );

                sst.equal(input, '', 'should not modify the input');
                sst.equal(output, 'two\n', 'should write the transformed doc');
            });
        });

        st.test('should write injected files', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Change the tree */
                        tree.value = 'two';
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': true,
                'files': [
                    toVFile(join(cwd, 'one.txt'))
                ]
            }, function (err, code) {
                var input = read(join(cwd, 'one.txt'), 'utf8');

                /* Reset the file. */
                fs.truncateSync(join(cwd, 'one.txt'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');
                sst.equal(stderr(), 'one.txt: written\n', 'should not report');
                sst.equal(input, 'two\n', 'should not modify the input');
            });
        });

        st.test('should not write without file-path', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree, file) {
                        /* Change the tree */
                        tree.value = 'two';

                        /* Remove the file-path */
                        file.directory = file.filename = file.extension = null;
                    }
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': true,
                'globs': ['one.txt'],
                'extensions': ['txt']
            }, function (err, code) {
                var input = read(join(cwd, 'one.txt'), 'utf8');

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');
                sst.equal(input, '', 'should not modify the input');
                sst.equal(
                    stderr(true),
                    'one.txt: no issues found\n',
                    'should not report'
                );
            });
        });

        st.test('should fail when writing files to one path', function (sst) {
            var cwd = join(fixtures, 'two-files');
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': 'three.txt',
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                var report = stderr(true).split('\n').slice(0, 2);

                report[1] = report[1].slice(0, report[1].lastIndexOf(':'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    report.join('\n'),
                    'one.txt\n' +
                    '        1:1  error    Error: Cannot write ' +
                        'multiple files to single output',
                    'should report'
                );
            });
        });

        st.test(
            'should fail when writing to non-existent dirs',
            function (sst) {
                var cwd = join(fixtures, 'two-files');
                var stderr = spy();

                sst.plan(3);

                engine({
                    'processor': noop,
                    'cwd': cwd,
                    'streamError': stderr.stream,
                    'output': 'three/',
                    'globs': ['.'],
                    'extensions': ['txt']
                }, function (err, code) {
                    var report = stderr(true).split('\n').slice(0, 3);

                    report[2] = report[2]
                        .slice(0, report[2].indexOf('ENOENT'));

                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 1, 'should exit with `1`');

                    sst.equal(
                        report.join('\n'),
                        'one.txt\n' +
                        '        1:1  error    Error: Cannot read ' +
                        'output directory. Error:\n',
                        'should report'
                    );
                });
            }
        );
    });

    t.test('tree', function (st) {
        st.plan(5);

        st.test('should fail on malformed input', function (sst) {
            var cwd = join(fixtures, 'malformed-tree');
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': cwd,
                'streamError': stderr.stream,
                'treeIn': true,
                'globs': ['doc.json']
            }, function (err, code) {
                var report = stderr(true).split('\n').slice(0, 2);

                report[1] = report[1].slice(0, report[1].indexOf('of'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    report.join('\n'),
                    'doc.json\n' +
                    '        1:1  error    SyntaxError: Unexpected end ',
                    'should report'
                );
            });
        });

        st.test(
            'should read and write JSON when `tree` is given',
            function (sst) {
                var cwd = join(fixtures, 'tree');
                var stderr = spy();

                sst.plan(4);

                engine({
                    'processor': noop().use(function () {
                        return function (tree) {
                            /* Modify tree */
                            tree.value = 'two';
                        };
                    }),
                    'cwd': cwd,
                    'streamError': stderr.stream,
                    'output': true,
                    'tree': true,
                    'globs': ['doc']
                }, function (err, code) {
                    var doc = read(join(cwd, 'doc.json'), 'utf8');

                    /* Remove the file. */
                    unlink(join(cwd, 'doc.json'));

                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 0, 'should exit with `0`');

                    sst.equal(
                        stderr(true),
                        'doc > doc.json: written\n',
                        'should report'
                    );

                    sst.equal(
                        doc,
                        [
                            '{',
                            '  "type": "text",',
                            '  "value": "two"',
                            '}'
                        ].join('\n') + '\n',
                        'should write the transformed doc as JSON'
                    );
                });
            }
        );

        st.test('should read JSON when `treeIn` is given', function (sst) {
            var cwd = join(fixtures, 'tree');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Modify tree */
                        tree.value = 'two';
                    };
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': true,
                'treeIn': true,
                'globs': ['doc'],
                'extensions': ['foo']
            }, function (err, code) {
                var doc = read(join(cwd, 'doc.foo'), 'utf8');

                /* Remove the file. */
                unlink(join(cwd, 'doc.foo'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(true),
                    'doc > doc.foo: written\n',
                    'should report'
                );

                sst.equal(
                    doc,
                    'two\n',
                    'should write the transformed doc as `foo`'
                );
            });
        });

        st.test('should write JSON when `treeOut` is given', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop().use(function () {
                    return function (tree) {
                        /* Modify tree */
                        tree.value = 'two';
                    };
                }),
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': true,
                'treeOut': true,
                'globs': ['.'],
                'extensions': ['txt']
            }, function (err, code) {
                var doc = read(join(cwd, 'one.json'), 'utf8');

                /* Remove the file. */
                unlink(join(cwd, 'one.json'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(true),
                    'one.txt > one.json: written\n',
                    'should report'
                );

                sst.equal(
                    doc,
                    [
                        '{',
                        '  "type": "text",',
                        '  "value": "two"',
                        '}'
                    ].join('\n') + '\n',
                    'should write the transformed doc as JSON'
                );
            });
        });

        st.test('should write injected files', function (sst) {
            var cwd = join(fixtures, 'one-file');
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': cwd,
                'streamError': stderr.stream,
                'output': 'bar',
                'treeOut': true,
                'files': [
                    toVFile(join(cwd, 'one.txt'))
                ]
            }, function (err, code) {
                /* Remove the file. */
                unlink(join(cwd, 'bar.json'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');
                sst.equal(
                    stderr(true),
                    'one.txt > bar.json: written\n',
                    'should report'
                );
            });
        });
    });

    t.test('file-path', function (st) {
        st.plan(2);

        st.test('should throw on `file-path` with files', function (sst) {
            sst.plan(1);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'simple-structure'),
                'globs': ['.'],
                'filePath': 'qux/quux.foo',
                'extensions': ['txt']
            }, function (err) {
                sst.equal(
                    err.message.split('\n').slice(0, 2).join('\n'),
                    [
                        'Do not pass both `--file-path` and real files.',
                        'Did you mean to pass stdin instead of files?'
                    ].join('\n'),
                    'should fail'
                )
            });
        });

        st.test('should support `file-path`', function (sst) {
            var stdout = spy();
            var stderr = spy();
            var stream = new PassThrough();
            var index = 0;

            sst.plan(3);

            function send() {
                if (++index > 10) {
                    stream.end();
                } else {
                    stream.write(index + '\n');
                    setTimeout(send, 10);
                }
            }

            send();

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'empty'),
                'streamOut': stdout.stream,
                'streamError': stderr.stream,
                'globs': [],
                'streamIn': stream,
                'filePath': 'foo/bar.baz'
            }, function (err, code) {
                stdout();

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');

                sst.equal(
                    stderr(),
                    'foo/bar.baz: no issues found\n',
                    'should report'
                );
            });
        });
    });

    t.test('color', function (st) {
        st.plan(1);

        st.test('should support color', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop,
                'cwd': join(fixtures, 'empty'),
                'streamError': stderr.stream,
                'globs': ['readme.md'],
                'color': true
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr(),
                    [
                        '\x1b[4m\x1b[31mreadme.md\x1b[39m\x1b[24m',
                        '        1:1  \x1b[31merror\x1b[39m    No ' +
                            'such file or directory',
                        '',
                        '\x1b[31m✖\x1b[39m 1 error',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });
    });

    t.test('reporting', function (st) {
        st.plan(4);

        st.test('should fail for warnings with `frail`', function (sst) {
            var stderr = spy();

            sst.plan(3);

            engine({
                'processor': noop().use(function () {
                    return function (tree, file) {
                        file.warn('Warning');
                    };
                }),
                'cwd': join(fixtures, 'one-file'),
                'streamError': stderr.stream,
                'globs': ['one.txt'],
                'frail': true
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 1, 'should exit with `1`');

                sst.equal(
                    stderr(),
                    [
                        'one.txt',
                        '        1:1  warning  Warning',
                        '',
                        '⚠ 1 warning',
                        ''
                    ].join('\n'),
                    'should report'
                );
            });
        });

        st.test(
            'should not report succesful files when `quiet` (#1)',
            function (sst) {
                var stderr = spy();

                sst.plan(3);

                engine({
                    'processor': noop().use(function () {
                        return function (tree, file) {
                            if (file.filename === 'two') {
                                file.warn('Warning!');
                            }
                        };
                    }),
                    'cwd': join(fixtures, 'two-files'),
                    'streamError': stderr.stream,
                    'globs': ['.'],
                    'extensions': ['txt'],
                    'quiet': true
                }, function (err, code) {
                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 0, 'should exit with `0`');

                    sst.equal(
                        stderr(),
                        [
                            'two.txt',
                            '        1:1  warning  Warning!',
                            '',
                            '⚠ 1 warning',
                            ''
                        ].join('\n'),
                        'should report correctly'
                    );
                });
            }
        );

        st.test(
            'should not report succesful files when `quiet` (#2)',
            function (sst) {
                var stderr = spy();

                sst.plan(3);

                engine({
                    'processor': noop(),
                    'cwd': join(fixtures, 'one-file'),
                    'streamError': stderr.stream,
                    'globs': ['.'],
                    'extensions': ['txt'],
                    'quiet': true
                }, function (err, code) {
                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 0, 'should exit with `0`');
                    sst.equal(stderr(), '', 'should not report');
                });
            }
        );

        st.test(
            'should not report succesful files when ' +
            '`silent`',
            function (sst) {
                var stderr = spy();

                sst.plan(3);

                engine({
                    'processor': noop().use(function () {
                        return function (tree, file) {
                            file.warn('Warning!');

                            if (file.filename === 'two') {
                                file.fail('Error!');
                            }
                        };
                    }),
                    'cwd': join(fixtures, 'two-files'),
                    'streamError': stderr.stream,
                    'globs': ['.'],
                    'extensions': ['txt'],
                    'silent': true
                }, function (err, code) {
                    sst.error(err, 'should not fail fatally');
                    sst.equal(code, 1, 'should exit with `1`');

                    sst.equal(
                        stderr(),
                        [
                            'two.txt',
                            '        1:1  error    Error!',
                            '',
                            '✖ 1 error',
                            ''
                        ].join('\n'),
                        'should report correctly'
                    );
                });
            }
        );
    });

    t.test('completers', function (st) {
        st.plan(2);

        st.test('should pass `fileSet` to plug-ins', function (sst) {
            var stderr = spy();

            /* 5 in the attacher, which is invoked 2 times,
             * 1 in `testSet`, which is invoked 2 times,
             * 3 in the callback. */
            sst.plan(15);

            function testSet(set, nr) {
                var paths = set.files.map(function (file) {
                    return file.filePath();
                });

                sst.deepEqual(
                    paths,
                    [
                        'one.txt',
                        'two.txt'
                    ],
                    'should expose the files and set to ' +
                    '`completer` (' + nr + ')'
                );
            }

            function completer(set) {
                testSet(set, 1);
            }

            engine({
                'processor': noop,
                'streamError': stderr.stream,
                'injectedPlugins': [
                    function (processor, settings, set) {
                        sst.equal(
                            typeof set,
                            'object',
                            'should pass a set'
                        );

                        sst.equal(
                            typeof set.use,
                            'function',
                            'should have a `use` method'
                        );

                        sst.equal(
                            typeof set.add,
                            'function',
                            'should have an `add` method'
                        );

                        /* The completer is added multiple times,
                         * but it’s detected that its the same
                         * function so it’s run once. */
                        sst.equal(
                            set.use(completer),
                            set,
                            'should be able to `use` a completer'
                        );

                        /* Most often, completers cannot be
                         * detected to be the same because
                         * they’re created inside attachers.
                         * `pluginId` can be used for those
                         * to ensure the completer runs once.
                         */
                        function otherCompleter(subset) {
                            testSet(subset, 2);
                        }

                        otherCompleter.pluginId = 'foo';

                        set.use(otherCompleter);

                        /* First, this plug-in is attached for
                         * `one.txt`, where it adds `two.txt`.
                         * Then, this plug-in is attached for
                         * `two.txt`, but it doesn’t re-add
                         * `two.txt` as it’s already added. */
                        sst.equal(
                            set.add('two.txt'),
                            set,
                            'should be able to `add` a file'
                        );
                    }
                ],
                'cwd': join(fixtures, 'two-files'),
                'globs': ['one.txt']
            }, function (err, code) {
                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');
                sst.equal(
                    stderr(),
                    'one.txt: no issues found\n',
                    'should report only given files'
                );
            });
        });

        st.test('should pass `fileSet` to plug-ins', function (sst) {
            var cwd = join(fixtures, 'extensions');
            var stderr = spy();

            sst.plan(4);

            engine({
                'processor': noop,
                'streamError': stderr.stream,
                'injectedPlugins': [
                    function (processor, settings, set) {
                        /* Add a file. */
                        set.add('bar.text');
                    }
                ],
                'cwd': cwd,
                'globs': ['foo.txt'],
                'output': 'nested/'
            }, function (err, code) {
                var doc = read(join(cwd, 'nested', 'foo.txt'), 'utf8');

                /* Remove the file. */
                unlink(join(cwd, 'nested', 'foo.txt'));

                sst.error(err, 'should not fail fatally');
                sst.equal(code, 0, 'should exit with `0`');
                sst.equal(doc, '', 'should write given files');
                sst.equal(
                    stderr(),
                    'foo.txt > nested/foo.txt: written\n',
                    'should report only given files'
                );
            });
        });
    });
});
