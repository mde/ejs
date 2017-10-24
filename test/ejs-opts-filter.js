/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var ejs = require('..');
var ejstest = require('./ejs');
var assert = require('assert');
var fs = require('fs');
var read = fs.readFileSync;

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8');
}

/**
 * Load plugin
 * Since this is global, this will install the plugin,
 * before any test in any test/*.js file is executed
 * So the origClass will be restored
 */
var origClass = ejs.Template;
var filter = require('../plugins/ejs-opts-filter');
var filterClass = ejs.Template;
ejs.Template = origClass; // do not affect test/ejs.js


suite('ejs.locals original tests with plugin', function () {

  suiteSetup(function () {
    ejs.Template = filterClass;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
  });

  ejstest.ejstests();
});

suite('ejs.locals blocks', function () {

  suiteSetup(function () {
    ejs.Template = filterClass;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
    filter.removeOpts = [];
    filter.keepOnlyOpts = undefined;
  });

  setup(function () {
    filter.removeOpts = [];
    filter.keepOnlyOpts = undefined;
  });

  test('removeOpts', function () {
    assert.equal(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
    filter.removeOpts = ['strict'];
    assert.notEqual(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
  });

  test('keepOnlyOpts', function () {
    assert.equal(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
    filter.keepOnlyOpts = ['cache'];
    assert.notEqual(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
  });

  test('keepOnlyOpts & removeOpts', function () {
    assert.equal(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
    filter.keepOnlyOpts = ['cache'];
    filter.keepOnlyOpts = ['cache'];
    assert.notEqual(ejs.render(fixture('strict.ejs'), {}, {strict: true, cache: false}), 'true');
  });

  test('optsDefaults', function () {
    filter.optsDefaults.strict = true;
    assert.equal(ejs.render(fixture('strict.ejs'), {}, {cache: false}), 'true');
  });

});

