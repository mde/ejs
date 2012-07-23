// Load the basic Geddy toolkit
require('../../lib/geddy');

var assert = require('assert');

tests = {

  'test camelize basic': function () {
    var str = 'foo_bar_baz'
      , actual = geddy.string.camelize(str);
    assert.equal('fooBarBaz', actual);
  }

, 'test camelize no initial cap from capitalized snake': function () {
    var str = 'Foo_bar_baz'
      , actual = geddy.string.camelize(str);
    assert.equal('fooBarBaz', actual);
  }

, 'test camelize initial cap': function () {
    var str = 'foo_bar_baz'
      , actual = geddy.string.camelize(str, {initialCap: true});
    assert.equal('FooBarBaz', actual);
  }

, 'test camelize leading underscore': function () {
    var str = '_foo_bar_baz'
      , actual = geddy.string.camelize(str, {leadingUnderscore: true});
    assert.equal('_fooBarBaz', actual);
  }

};

module.exports = tests;


