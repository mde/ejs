/* jshint mocha: true */

/*
 * Spec for the reworked CLI argument parser (see cli-parser-plan.md).
 *
 * CONTRACT (target — these tests are RED until parseargs.js is reimplemented):
 *
 *   new Parser(specs).parse(argv) -> {
 *     opts:     { <full-name>: string | true },   // null-prototype; last-wins
 *     operands: [ <string>, ... ],                // OPAQUE positionals, in order
 *     errors:   [ { code, arg }, ... ]            // collected, never thrown
 *   }
 *
 *   spec item: { full, abbr, expectValue }        // expectValue truthy => takes a value
 *   error codes: 'unknown-option' | 'missing-value' | 'unexpected-value'
 *
 * The parser is pure: no I/O, no process.exit, no throwing on user input, it does
 * NOT mutate argv, and it does NOT split operands on '='. Template-vs-data
 * classification and the first-'=' split of data are the CLI's job.
 *
 * Each test notes the scar it guards (parseArgs/pkgjs, glibc, or ejs #690).
 */

var { Parser } = require('../lib/cjs/parseargs');
var assert = require('assert');

var TEST_OPTS = [
  { full: 'output-file',   abbr: 'o', expectValue: true },
  { full: 'delimiter',     abbr: 'm', expectValue: true },
  { full: 'strict',        abbr: 's' },
  { full: 'debug',         abbr: 'd' },
  { full: 'rm-whitespace', abbr: 'w' },
  { full: 'help',          abbr: 'h' },
  { full: 'version',       abbr: 'V' },
  { full: 'version',       abbr: 'v' },   // second abbr for same full name
];

function parse(argv) {
  return new Parser(TEST_OPTS).parse(argv);
}

// A successful parse must report no errors — assert it everywhere, not just the value.
function assertClean(r) {
  assert.deepEqual(r.errors, []);
}

suite('parseargs', function () {

  // ---- basic value options -------------------------------------------------

  test('short opt, spaced value', function () {
    var r = parse(['-o', 'foo.html', 'tpl.ejs']);
    assert.equal(r.opts['output-file'], 'foo.html');
    assert.deepEqual(r.operands, ['tpl.ejs']);
    assertClean(r);
  });

  test('long opt, spaced value', function () {
    var r = parse(['--output-file', 'foo.html', 'tpl.ejs']);
    assert.equal(r.opts['output-file'], 'foo.html');
    assertClean(r);
  });

  test('long opt, = value', function () {
    var r = parse(['--output-file=foo.html', 'tpl.ejs']);
    assert.equal(r.opts['output-file'], 'foo.html');
    assertClean(r);
  });

  // ---- attached short values (glibc -fFILE; ejs #690 -m'|') ----------------

  test('attached short value: -mFOO', function () {
    var r = parse(['-mFOO']);
    assert.equal(r.opts['delimiter'], 'FOO');
    assertClean(r);
  });

  test('attached short value: -m| (ejs #690 — was silently ignored)', function () {
    var r = parse(['-m|']);
    assert.equal(r.opts['delimiter'], '|');
    assertClean(r);
  });

  // ---- boolean flags & grouping (glibc -rvf; parseArgs short groups) -------

  test('boolean flag short', function () {
    var r = parse(['-d']);
    assert.equal(r.opts['debug'], true);
    assertClean(r);
  });

  test('boolean flag long', function () {
    assert.equal(parse(['--debug']).opts['debug'], true);
  });

  test('grouped booleans: -sdw', function () {
    var r = parse(['-sdw']);
    assert.equal(r.opts['strict'], true);
    assert.equal(r.opts['debug'], true);
    assert.equal(r.opts['rm-whitespace'], true);
    assertClean(r);
  });

  test('group with trailing value-taker: -sm| (booleans then value)', function () {
    var r = parse(['-sm|']);
    assert.equal(r.opts['strict'], true);
    assert.equal(r.opts['delimiter'], '|');
    assertClean(r);
  });

  test('group with trailing value-taker consumes next arg: -sm |', function () {
    var r = parse(['-sm', '|']);
    assert.equal(r.opts['strict'], true);
    assert.equal(r.opts['delimiter'], '|');
    assertClean(r);
  });

  // ---- first '=' split (parseArgs --so=wat=bing) ---------------------------

  test("split on first '=' only: --delimiter=a=b -> 'a=b'", function () {
    var r = parse(['--delimiter=a=b']);
    assert.equal(r.opts['delimiter'], 'a=b');
    assertClean(r);
  });

  test('explicit empty value via = is a real empty string', function () {
    var r = parse(['--delimiter=']);
    assert.strictEqual(r.opts['delimiter'], '');
    assertClean(r);
  });

  test('spaced empty-string value is a real value, not missing', function () {
    var r = parse(['-m', '']);
    assert.strictEqual(r.opts['delimiter'], '');
    assertClean(r);
  });

  // ---- unknown options ERROR (ejs #690; parseArgs strict) ------------------

  test('unknown long opt -> error, not ignored (ejs #690)', function () {
    var r = parse(['--foo', 'tpl.ejs']);
    assert.equal(r.errors.length, 1);
    assert.equal(r.errors[0].code, 'unknown-option');
    assert.equal(r.errors[0].arg, '--foo');
    assert.strictEqual(r.opts['foo'], undefined);
    assert.deepEqual(r.operands, ['tpl.ejs']);
  });

  test('unknown short opt -> error', function () {
    assert.equal(parse(['-z']).errors[0].code, 'unknown-option');
  });

  // Unknown char is LAST-but-one so "kept parsing past it" is detectable:
  // if the group wrongly continued, 'h' (help) would be set.
  test('unknown char stops the group: -dzh (help must NOT be set)', function () {
    var r = parse(['-dzh']);
    assert.equal(r.opts['debug'], true);
    assert.strictEqual(r.opts['help'], undefined);
    assert.equal(r.errors.some(function (e) { return e.code === 'unknown-option'; }), true);
  });

  test('excess dashes are not a valid option: ---triple -> error', function () {
    // parseArgs (non-strict) keeps '-triple'; we always validate.
    assert.equal(parse(['---triple']).errors[0].code, 'unknown-option');
  });

  test('multiple errors collected in order', function () {
    var r = parse(['--foo', '--bar']);
    assert.equal(r.errors.length, 2);
    assert.equal(r.errors[0].arg, '--foo');
    assert.equal(r.errors[1].arg, '--bar');
  });

  test('value given to a boolean is rejected: --debug=false', function () {
    var r = parse(['--debug=false']);
    assert.equal(r.errors[0].code, 'unexpected-value');
  });

  // ---- prototype safety (parseArgs __proto__/toString; Codex review) -------
  // Assert the actual guarantee (prototype is null) and inspect OWN keys after
  // hostile input — not opts.toString, which a plain object could also satisfy.

  test('opts has a null prototype', function () {
    assert.strictEqual(Object.getPrototypeOf(parse([]).opts), null);
  });

  test('--constructor: unknown; opts still null-proto with no junk keys', function () {
    var r = parse(['--constructor']);
    assert.equal(r.errors[0].code, 'unknown-option');
    assert.strictEqual(Object.getPrototypeOf(r.opts), null);
    assert.deepStrictEqual(Object.keys(r.opts), []);   // no 'constructor', no 'undefined'
  });

  test('--__proto__=polluted: unknown; no key set, global proto untouched', function () {
    var r = parse(['--__proto__=polluted']);
    assert.equal(r.errors[0].code, 'unknown-option');
    assert.deepStrictEqual(Object.keys(r.opts), []);
    assert.strictEqual(({}).polluted, undefined);      // Object.prototype not polluted
  });

  test('--toString is unknown (we have no such option)', function () {
    assert.equal(parse(['--toString']).errors[0].code, 'unknown-option');
  });

  // ---- missing values & dash-led values (Decision 1: reject) ---------------

  test('value option at end with no value -> missing-value (not true)', function () {
    var r = parse(['-o']);
    assert.equal(r.errors[0].code, 'missing-value');
    assert.notStrictEqual(r.opts['output-file'], true);
  });

  test('dash-led value is a forgotten-value error: -o -d', function () {
    // Decision 1: do NOT consume '-d' as the value.
    var r = parse(['-o', '-d']);
    assert.equal(r.errors.some(function (e) { return e.code === 'missing-value'; }), true);
  });

  test("dash-led value via '=' IS accepted: -o=-weird.html", function () {
    var r = parse(['-o=-weird.html']);
    assert.equal(r.opts['output-file'], '-weird.html');
    assertClean(r);
  });

  test("bare '-' is not an operand and not a value -> unknown option", function () {
    assert.equal(parse(['-']).errors[0].code, 'unknown-option');
  });

  // ---- help / version at the parse layer (dispatch is the CLI's job) -------

  test('grouped help: -dh sets both (CLI decides precedence later)', function () {
    var r = parse(['-dh']);
    assert.equal(r.opts['debug'], true);
    assert.equal(r.opts['help'], true);
    assertClean(r);
  });

  test('value-containing h: -mh is delimiter "h", NOT help', function () {
    var r = parse(['-mh']);
    assert.equal(r.opts['delimiter'], 'h');
    assert.strictEqual(r.opts['help'], undefined);
    assertClean(r);
  });

  test('version via either abbr', function () {
    assert.equal(parse(['-V']).opts['version'], true);
    assert.equal(parse(['-v']).opts['version'], true);
  });

  // ---- '--' terminator (parseArgs; POSIX G10) ------------------------------

  test("'--' ends options; following args are operands, '--' not stored", function () {
    var r = parse(['-d', '--', '-weird.ejs', 'name=foo']);
    assert.equal(r.opts['debug'], true);
    assert.deepEqual(r.operands, ['-weird.ejs', 'name=foo']);
    assertClean(r);
  });

  test("lone '--' is consumed, not an operand", function () {
    var r = parse(['--debug', '--']);
    assert.equal(r.opts['debug'], true);
    assert.deepEqual(r.operands, []);
    assertClean(r);
  });

  // ---- last-wins, NOT arrays (anti-lesson: minimist/#788) ------------------

  test('repeated scalar option: last wins, stays a string', function () {
    var r = parse(['-o', 'a', '-o', 'b']);
    assert.equal(r.opts['output-file'], 'b');            // not ['a','b']
    assert.equal(Array.isArray(r.opts['output-file']), false);
    assertClean(r);
  });

  test('short and long forms of same option: last wins', function () {
    assert.equal(parse(['-o', 'a', '--output-file=b']).opts['output-file'], 'b');
  });

  // ---- operands opaque; permutation kept -----------------------------------

  test('operands returned opaque, NOT split on = (CLI classifies)', function () {
    var r = parse(['tpl.ejs', 'name=foo', 'x=a=b']);
    assert.deepEqual(r.operands, ['tpl.ejs', 'name=foo', 'x=a=b']);
    assert.deepStrictEqual(Object.keys(r.opts), []);
    assertClean(r);
  });

  test('options may appear after operands (permutation; docs require it)', function () {
    var r = parse(['tpl.ejs', '-o', 'out.html']);
    assert.equal(r.opts['output-file'], 'out.html');
    assert.deepEqual(r.operands, ['tpl.ejs']);
    assertClean(r);
  });

  test('empty argv', function () {
    var r = parse([]);
    assert.deepEqual(r.operands, []);
    assert.deepStrictEqual(Object.keys(r.opts), []);
    assertClean(r);
  });

  // ---- purity: no argv mutation, reusable parser ---------------------------

  test('does not mutate the input array (indexed scan, not shift/unshift)', function () {
    var argv = Object.freeze(['-o', 'out.html', 'tpl.ejs']);
    var r;
    assert.doesNotThrow(function () { r = parse(argv); });  // frozen => throws if mutated
    assert.equal(argv.length, 3);                           // unchanged
    assert.equal(r.opts['output-file'], 'out.html');
  });

  test('same parser instance is reusable across calls', function () {
    var p = new Parser(TEST_OPTS);
    var a = p.parse(['-d', 'one.ejs']);
    var b = p.parse(['-s', 'two.ejs']);
    assert.equal(a.opts['debug'], true);
    assert.strictEqual(a.opts['strict'], undefined);        // no bleed from b
    assert.equal(b.opts['strict'], true);
    assert.strictEqual(b.opts['debug'], undefined);
    assert.deepEqual(a.operands, ['one.ejs']);
    assert.deepEqual(b.operands, ['two.ejs']);
  });

});
