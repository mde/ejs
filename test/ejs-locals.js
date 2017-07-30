/* jshint mocha: true */
/* eslint-env node, mocha */

/**
 * Module dependencies.
 */

var ejs = require('..');
var ejstest = require('./ejs');
var assert = require('assert');

/**
 * Load plugin
 * Since this is global, this will install the plugin,
 * before any test in any test/*.js file is executed
 * So the origClass will be restored
 */
var origClass = ejs.Template;
require('../plugins/ejs-locals');
var snippetClass = ejs.Template;
ejs.Template = origClass; // do not affect test/ejs.js

var fileloader = ejs.fileLoader;
var filechecker = ejs.fileExists;

var files = {
  '/test/layout1.ejs': 'layout1 begin <%- body %> end',
  '/layout.ejs': 'layout true begin <%- body %> end',

  '/test/partial1.ejs': 'P1',

  '/test/foo/_partial2.ejs': 'P2_',
  '/test/foo/partial2.ejs': 'P2.',
  '/test/foo/partial2/index.ejs': 'P2/',

  '/test/foo/partial3.ejs': 'P3.',
  '/test/foo/partial3/index.ejs': 'P3/',

  '/test/foo/partial4/index.ejs': 'P4/',

  '/test/partial-local.ejs': '<%- user %>',
  '/test/partial-obj1.ejs': '<%- my.user %>',
  '/test/partial-obj2.ejs': '<%- partialObj2.user %>',
  '/test/partial-obj1c.ejs': '<%- my.user %> (<%- indexInCollection %>)',
  '/test/partial-obj2c.ejs': '<%- partialObj2c.user %> (<%- indexInCollection %>)',
  '/test/partial-obj1k.ejs': '<%- my.user %> (<%- keyInCollection %>:<%- indexInCollection %>)',
  '/test/partial-obj2k.ejs': '<%- partialObj2k.user %> (<%- keyInCollection %>:<%- indexInCollection %>)',

  '/test/layout-block.ejs': 'layout block begin <%- block("b1") %> end',
  '/test/inc-block.ejs': '<%block("b2", "yonder")%>',
  '/test/layout-script-style.ejs': 'begin <%- script() %> X <%- stylesheet() %> end',
  '/test/inc-script-style.ejs': '<%script("cheese", "food")%><%stylesheet("water", "drink")%>',
};

function testLoad(name) {
  return files[name];
}
function testExists(name) {
  return !!files[name];
}

suite('ejs.locals original tests with plugin', function () {

  suiteSetup(function () {
    ejs.Template = snippetClass;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
  });

  ejstest.ejstests();
});

suite('ejs.locals layout', function () {

  suiteSetup(function () {
    ejs.Template = snippetClass;
    ejs.fileLoader = testLoad;
    ejs.fileExists = testExists;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
    ejs.fileLoader = fileloader;
    ejs.fileExists = filechecker;
  });

  setup(function () {
    ejs.cache.reset();
  });

  test('use layout, no extension', function () {
    var fn = ejs.compile('123 <%-layout("layout1")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), 'layout1 begin 123  456 end');
  });

  test('use layout, with extension', function () {
    var fn = ejs.compile('123 <%-layout("layout1.ejs")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), 'layout1 begin 123  456 end');
  });

  test('use _layoutFile', function () {
    var fn = ejs.compile('123  456', {filename: '/test/foo.ejs'});
    assert.equal(fn({_layoutFile: 'layout1.ejs'}), 'layout1 begin 123  456 end');
  });

  test('use _layoutFile = true', function () {
    var fn = ejs.compile('123  456', {filename: '/test/foo.ejs'});
    assert.equal(fn({_layoutFile: true}), 'layout true begin 123  456 end');
  });

  test('use layout, layout in tmpl takes precedence over _layoutFile', function () {
    var fn = ejs.compile('123 <%-layout("layout1.ejs")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn({_layoutFile: '/layout'}), 'layout1 begin 123  456 end');
  });


});

suite('ejs.locals partials', function () {

  suiteSetup(function () {
    ejs.Template = snippetClass;
    ejs.fileLoader = testLoad;
    ejs.fileExists = testExists;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
    ejs.fileLoader = fileloader;
    ejs.fileExists = filechecker;
  });

  setup(function () {
    ejs.cache.reset();
  });

  test('use partial, no extension', function () {
    var fn = ejs.compile('123 <%-partial("partial1")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 P1 456');
  });

  test('find partial, _name has priority', function () {
    var fn = ejs.compile('123 <%-partial("foo/partial2")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 P2_ 456');
  });

  test('find partial, plain name, if no _name', function () {
    var fn = ejs.compile('123 <%-partial("foo/partial3")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 P3. 456');
  });

  test('find partial, name/index.ejs, if no name.ejs', function () {
    var fn = ejs.compile('123 <%-partial("foo/partial4")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 P4/ 456');
  });

  test('find partial, absolute path', function () {
    var fn = ejs.compile('123 <%-partial("/partial2")%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 P2_ 456');
  });

  test('partial, access to locals', function () {
    var fn = ejs.compile('123 <%-partial("/partial-local")%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn({user: 'admin'}), '123 admin 456');
  });

  test('partial, access to modified locals', function () {
    var fn = ejs.compile('<% user="nobody" %>123 <%-partial("/partial-local")%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn({user: 'admin'}), '123 nobody 456');
  });

  test('partial, locals overriden by data', function () {
    var fn = ejs.compile('123 <%-partial("/partial-local", {user: "none"})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn({user: 'admin'}), '123 none 456');
  });

  test('partial, data - no locals', function () {
    var fn = ejs.compile('123 <%-partial("/partial-local", {user: "none"})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 none 456');
  });

  test('partial, object with as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj1", {object: {user: "me"}, as: "my"})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me 456');
  });

  test('partial, object without as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj2", {object: {user: "me"}})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me 456');
  });

  test('partial, array ', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj2c", [{user: "me"}, {user: "you"}])%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me (0)you (1) 456');
  });

  test('partial, collection array with as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj1c", {collection: [{user: "me"}, {user: "-"}], as: "my"})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me (0)- (1) 456');
  });

  test('partial, collection array without as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj2c", {collection: [{user: "me"}, {user: "-"}]})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me (0)- (1) 456');
  });

  test('partial, collection object with as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj1k", {collection: {a: {user: "me"}, b: {user: "-"}}, as: "my"})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me (a:0)- (b:1) 456');
  });

  test('partial, collection object without as', function () {
    var fn = ejs.compile('123 <%-partial("/partial-obj2k", {collection: {a: {user: "me"}, b: {user: "-"}}})%> 456', {filename: '/test/foo.ejs', root: '/test/foo'});
    assert.equal(fn(), '123 me (a:0)- (b:1) 456');
  });



});

suite('ejs.locals blocks', function () {

  suiteSetup(function () {
    ejs.Template = snippetClass;
    ejs.fileLoader = testLoad;
    ejs.fileExists = testExists;
  });

  suiteTeardown(function () {
    ejs.Template = origClass;
    ejs.fileLoader = fileloader;
    ejs.fileExists = filechecker;
  });

  setup(function () {
    ejs.cache.reset();
  });

  test('block is empty if not set', function () {
    var fn = ejs.compile('123 <%-block("foo")%> 456');
    assert.equal(fn(), '123  456');
  });

  test('block returns value', function () {
    var fn = ejs.compile('<%block("foo", "val")%>123 <%-block("foo")%> 456');
    assert.equal(fn(), '123 val 456');
  });

  test('block returns value, then append', function () {
    var fn = ejs.compile('<%block("foo", "val")%>123 <%-block("foo")%> <%block("foo", "bar")%>456 <%-block("foo")%>');
    assert.equal(fn(), '123 val 456 val\nbar');
  });

  test('block returns value, when set', function () {
    var fn = ejs.compile('123 <%-block("foo", "val")%> 456');
    assert.equal(fn(), '123 val 456');
  });

  test('2 blocks, 2 values', function () {
    var fn = ejs.compile('<%block("foo", "val")%><%block("bar", "abc")%>123 <%-block("foo")%> 456 <%-block("bar")%>');
    assert.equal(fn(), '123 val 456 abc');
  });

  test('block passed to layout', function () {
    var fn = ejs.compile('<%block("b1", "here")%>123 <% layout("layout-block")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), 'layout block begin here end');
  });

  test('block passed to partial', function () {
    var fn = ejs.compile('<%block("b1", "here")%>123 <%- partial("layout-block")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 layout block begin here end 456');
  });

  test('block passed from partial', function () {
    var fn = ejs.compile('<%- partial("inc-block")%>123 <%- block("b2") %> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 yonder 456');
  });

  test('block passed from partial appends to existing', function () {
    var fn = ejs.compile('<%block("b2", "over")%><%- partial("inc-block")%>123 <%- block("b2") %> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 over\nyonder 456');
  });

  test('block passed to include', function () {
    var fn = ejs.compile('<%block("b1", "here")%>123 <%- include("layout-block")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 layout block begin here end 456');
  });

  test('block passed from include', function () {
    var fn = ejs.compile('<%- include("inc-block")%>123 <%- block("b2") %> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 yonder 456');
  });

  test('script', function () {
    var fn = ejs.compile('<%script("val")%><%script("cheese", "food")%>123 <%-script()%> 456');
    assert.equal(fn(), '123 <script src="val"></script>\n<script src="cheese" type="food"></script> 456');
  });

  test('stylesheet', function () {
    var fn = ejs.compile('<%stylesheet("val")%><%stylesheet("cheese", "food")%>123 <%-stylesheet()%> 456');
    assert.equal(fn(), '123 <link rel="stylesheet" href="val" />\n<link rel="stylesheet" href="cheese" media="food" /> 456');
  });

  test('script/stylesheet to layout', function () {
    var fn = ejs.compile('<%script("val")%><%stylesheet("foo")%>123 <%-layout("layout-script-style")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), 'begin <script src="val"></script> X <link rel="stylesheet" href="foo" /> end');
  });

  test('script/stylesheet to partial', function () {
    var fn = ejs.compile('<%script("val")%><%stylesheet("foo")%>123 <%-partial("layout-script-style")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 begin <script src="val"></script> X <link rel="stylesheet" href="foo" /> end 456');
  });

  test('script/stylesheet to include', function () {
    var fn = ejs.compile('<%script("val")%><%stylesheet("foo")%>123 <%-include("layout-script-style")%> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 begin <script src="val"></script> X <link rel="stylesheet" href="foo" /> end 456');
  });

  test('script/stylesheet from partial', function () {
    var fn = ejs.compile('<%-partial("inc-script-style")%>123 <%- script() %> X <%- stylesheet() %> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 <script src="cheese" type="food"></script> X <link rel="stylesheet" href="water" media="drink" /> 456');
  });

  test('script/stylesheet append by partial', function () {
    var fn = ejs.compile('<%script("val")%><%stylesheet("foo")%><%-partial("inc-script-style")%>123 <%- script() %> X <%- stylesheet() %> 456', {filename: '/test/foo.ejs'});
    assert.equal(fn(), '123 <script src="val"></script>\n<script src="cheese" type="food"></script> X <link rel="stylesheet" href="foo" />\n<link rel="stylesheet" href="water" media="drink" /> 456');
  });

});

