/* jshint mocha: true */
/* eslint-env node, mocha */

var parseargs = require('../lib/cjs/parseargs');
var assert = require('assert');

var TEST_OPTS = [
  { full: 'output-file',
    abbr: 'o',
    expectValue: true,
  },
  { full: 'debug',
    abbr: 'd',
    expectValue: false,
    allowValue: false,
  },
  { full: 'help',
    abbr: 'h',
  },
  { full: 'tasks',
    abbr: 't',
    expectValue: false,
    allowValue: true,
  },
  { full: 'version',
    abbr: 'V',
  },
  { full: 'version',
    abbr: 'v',
  },
];

suite('parseargs', function () {

  test('short opt with value', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-o', 'foo.html', 'template.ejs']);
    assert.equal(result.opts['output-file'], 'foo.html');
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('long opt with value', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['--output-file', 'foo.html', 'template.ejs']);
    assert.equal(result.opts['output-file'], 'foo.html');
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('long opt with equals syntax', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['--output-file=foo.html', 'template.ejs']);
    assert.equal(result.opts['output-file'], 'foo.html');
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('boolean flag (short)', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-d', 'template.ejs']);
    assert.equal(result.opts['debug'], true);
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('boolean flag (long)', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['--debug', 'template.ejs']);
    assert.equal(result.opts['debug'], true);
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('multiple opts combined', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-d', '-o', 'out.html', 'template.ejs']);
    assert.equal(result.opts['debug'], true);
    assert.equal(result.opts['output-file'], 'out.html');
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('env vars (key=value pairs)', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['template.ejs', 'name=foo', 'age=30']);
    assert.deepEqual(result.taskNames, ['template.ejs']);
    assert.equal(result.envVars['name'], 'foo');
    assert.equal(result.envVars['age'], '30');
  });

  test('env vars mixed with opts', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-d', 'template.ejs', 'name=foo']);
    assert.equal(result.opts['debug'], true);
    assert.deepEqual(result.taskNames, ['template.ejs']);
    assert.equal(result.envVars['name'], 'foo');
  });

  test('unknown opts are ignored', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['--unknown', 'template.ejs']);
    assert.equal(result.opts['unknown'], undefined);
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('allowValue opt can take a value', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-t', 'somevalue']);
    assert.equal(result.opts['tasks'], 'somevalue');
  });

  test('allowValue opt defaults to true when no value', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['-t', '-d']);
    assert.equal(result.opts['tasks'], true);
    assert.equal(result.opts['debug'], true);
  });

  test('multiple abbrs for same full name', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result1 = parser.parse(['-V']);
    var parser2 = new parseargs.Parser(TEST_OPTS);
    var result2 = parser2.parse(['-v']);
    assert.equal(result1.opts['version'], true);
    assert.equal(result2.opts['version'], true);
  });

  test('no args returns empty results', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse([]);
    assert.deepEqual(result.opts, {});
    assert.deepEqual(result.envVars, {});
    assert.deepEqual(result.taskNames, []);
  });

  test('positional arg before opts', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['template.ejs', '-d']);
    assert.equal(result.opts['debug'], true);
    assert.deepEqual(result.taskNames, ['template.ejs']);
  });

  test('multiple positional args', function () {
    var parser = new parseargs.Parser(TEST_OPTS);
    var result = parser.parse(['first.ejs', 'second.ejs']);
    assert.deepEqual(result.taskNames, ['first.ejs', 'second.ejs']);
  });

});
