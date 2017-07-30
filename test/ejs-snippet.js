/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var ejs = require('..');
ejs.enableSnippets();
var fs = require('fs');
var read = fs.readFileSync;
var assert = require('assert');

try {
  fs.mkdirSync(__dirname + '/tmp');
} catch (ex) {
  if (ex.code !== 'EEXIST') {
    throw ex;
  }
}


/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read('test/fixtures/' + name, 'utf8');
}


suite('ejs.snippet', function () {

  test('snippet', function () {
    var fn = ejs.compile('<%*snippet hello%>world<%*/snippet%>123 <%-snippet("hello")%> 456');
    assert.equal(fn(), '123 world 456');
  });

  test('snippet hoisted', function () {
    var fn = ejs.compile('123 <%-snippet("hello")%> 456<%*snippet hello%>world<%*/snippet%>');
    assert.equal(fn(), '123 world 456');
  });

  test('snippet sees locals before modifications', function () {
    var fn = ejs.compile('<%locals.name="planet"%><%*snippet hello%><%-name%><%*/snippet%>123 <%-snippet("hello")%> 456');
    assert.equal(fn({name: 'world'}), '123 world 456');
  });

  test('snippet modifies its own locals only', function () {
    var fn = ejs.compile('<%*snippet hello%><%locals.name="planet"%><%-name%><%*/snippet%>123 <%-snippet("hello")%> 456 <%-name%>');
    assert.equal(fn({name: 'world'}), '123 planet 456 world');
  });

  test('snippet take arguments merged to locals', function () {
    var fn = ejs.compile('<%*snippet hello%><%-name%> <%locals.name="planet"%><%-name%> <%-foo%><%*/snippet%>123 <%-snippet("hello", {name:"sun"})%> 456 <%-name%>');
    assert.equal(fn({name: 'world', foo: 'bar'}), '123 sun planet bar 456 world');
  });

  test('snippet can call itself recursive', function () {
    var fn = ejs.compile('<%* snippet hello %><%-foo%><%if(foo) {%><%- snippet("hello", {foo: foo-1})%><%}%><%* /snippet %>abc <%-snippet("hello", { foo: 5 })%> def');
    assert.equal(fn(), 'abc 543210 def');
  });

  test('snippet can call each other / recurse', function () {
    var fn = ejs.compile('<%* snippet hello %><%-foo%><%if(foo) {%><%- snippet("next", {foo: foo})%><%}%><%* /snippet %><%* snippet next %><%-snippet("hello", {foo: foo-1})%><%* /snippet %>abc <%-snippet("hello", { foo: 5 })%> def');
    assert.equal(fn(), 'abc 543210 def');
  });

  test('snippet defined in include, used in main', function () {
    var file = 'test/fixtures/snippet.ejs';
    assert.equal(ejs.render(fixture('snippet.ejs'), {}, {filename: file, cache:true,}),        fixture('snippet.html'));
  });

  test('snippet defined in main, used in include', function () {
    var file = 'test/fixtures/snippet-foo.ejs';
    assert.equal(ejs.render('<%*snippet hello%>world<%*/snippet%>123 <%-include("includes/snippet-inc2", {snip: "hello"})%> 456',
      {},
      {filename: file, cache:false,}),
    '123 world 456');
  });

  test('snippet defined in main, changed by include', function () {
    var file = 'test/fixtures/snippet-foo.ejs';
    assert.equal(ejs.render('<%*snippet bar%>world<%*/snippet%>123 <%for(var a in [1,2]){%><%-snippet("bar")%> <%-include("includes/snippet-inc")%><%}%>456',
      {},
      {filename: file, cache:false,}),
    '123 world \ngot bar \n456');
  });

  test('snippet defined in main, changed by include within the snippet (self replace)', function () {
    var file = 'test/fixtures/snippet-foo.ejs';
    assert.equal(ejs.render('<%*snippet bar%>world<%-include("includes/snippet-inc")%><%*/snippet%>123 <%for(var a in [1,2]){%><%-snippet("bar")%> <%}%>456',
      {},
      {filename: file, cache:false,}),
    '123 world\n got bar 456');
  });

});

