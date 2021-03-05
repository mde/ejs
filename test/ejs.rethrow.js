/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var assert = require('assert');
var ejs = require('../lib/ejs');

/**
 *  Make sure ejs exports all it is expected to export...
 */
suite('unit testing for completeness of module \'ejs.js\' exports', function () {
  test('expect \'rethrowError\' to be exported', function () {
    assert.ok(typeof(ejs.rethrowError)==='function');
  });
});

suite('unit testing exported function \'rethrowError\' of module \'ejs.js\'', function () {
  test('it should always throw: without parameters', function () {
    // TODO: Shouldn't 'Error: ejs:undefined' better point to: 'Error: ejs:0' or 'Error: ejs:[?]>'?
    const err = { name: 'Error' };
    assert.throws(() => { ejs.rethrowError(); }, err );
    try { ejs.rethrowError(); }
    catch( e ) {
      const errstr = 'Error: ejs:undefined\n\n\nInternal: Missing \'error\' instance for rewrite.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameter \'err\' {Error}', function () {
    const err = { name: 'Error' };
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.')); }, err );
    try { ejs.rethrowError(new Error('Out of fun.')); }
    catch( e ) {
      const errstr = 'Error: ejs:undefined\n\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string} and \'lineno\' {undefined}', function () {
    // TODO: Shouldn't we have defaults in a way, that 'str' is handled even if lineno is not given?
    // See: 'str' is ignored completely in resulting error message.
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str); }
    catch( e ) {
      const errstr = 'Error: ejs:undefined\n\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string} and \'lineno\' {0}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = 0;
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }
    catch( e ) {
      const errstr = 'Error: filename.js:0\n    1| some line (0)\n    2| some other line(1)\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string} and \'lineno\' {1}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = 1;
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }
    catch( e ) {
      const errstr = 'Error: filename.js:1\n >> 1| some line (0)\n    2| some other line(1)\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string} and \'lineno\' {2}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = 2;
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }
    catch( e ) {
      const errstr = 'Error: filename.js:2\n    1| some line (0)\n >> 2| some other line(1)\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string} and \'lineno\' {3}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = 3;
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno); }
    catch( e ) {
      const errstr = 'Error: filename.js:3\n    1| some line (0)\n    2| some other line(1)\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string}, \'lineno\' {undefined} and \'esc\' {function}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = undefined;
    const esc = (x) => { return 'foo' + x; };
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno, esc); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno, esc); }
    catch( e ) {
      const errstr = 'Error: foofilename.js:undefined\n\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
  test('it should always throw: with parameters \'err\' {Error}, \'str\' {string}, \'lineno\' {0} and \'esc\' {function}', function () {
    const err = { name: 'Error' };
    const str = 'some line (0)\nsome other line(1)';
    const flnm = 'filename.js';
    const lineno = 0;
    const esc = (x) => { return 'foo' + x; };
    assert.throws(() => { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno, esc); }, err );
    try { ejs.rethrowError(new Error('Out of fun.'), str, flnm, lineno, esc); }
    catch( e ) {
      const errstr = 'Error: foofilename.js:0\n    1| some line (0)\n    2| some other line(1)\n\nOut of fun.';
      // console.dir( e.toString());
      assert.ok( e.toString() === errstr );
    }
  });
});
