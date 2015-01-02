/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var ejs = require('../lib/ejs')
  , assert = require('assert')
  , tests
  , render = ejs.render;

tests = {

  'compiles a function': function () {
    var str = '<p>howdy</p>'
      , fn = ejs.compile(str);
    assert.equal(str, fn());
  }

, 'custom delimiter passed to render': function () {
    var str = "<&= foo; &>"
      , actual = render(str, {foo: 'FOO'}, {delimiter: '&'});
    assert.equal('FOO', actual);
  }

, 'custom delimiter globally': function () {
    ejs.delimiter = '$';
    var str = "<$= foo; $>"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
    delete ejs.delimiter;
  }

, 'client produces a standalone function': function () {
    var fn = ejs.compile('<p><%= foo %></p>', {client: true});
    var str = fn.toString();
    eval('var preFn = ' + str);
    assert.equal('<p>bar</p>', preFn({foo: 'bar'}));
  }

, 'empty template render': function () {
    var actual = render('');
    assert.equal('', actual);
  }

, 'rendering a single variable': function () {
    var str = "<% var foo = 'FOO'; %><%= foo; %>"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'rendering passed-in data': function () {
    var str = "<%= foo; %>"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'renderFile renders a template file': function (next) {
    ejs.renderFile('test/fixtures/file.ejs', function (err, html) {
      if (err) {
        throw err;
      }
      assert.equal('<p>w00t</p>', html);
      next();
    });
  }

, 'literal EJS': function () {
    var str = "<%% var foo = 'FOO'; %>"
      , actual = render(str);
    assert.equal("<% var foo = 'FOO'; %>", actual);
  }

, 'comments': function () {
    var str = "<%# Blah blah blah %><% var foo = 'FOO'; %><%= foo; %>"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'escaping': function () {
    var html;
    html = ejs.render('<%= name %>', {name: '&nbsp;<script>'});
    assert.equal('&amp;nbsp;&lt;script&gt;', html);
    html = ejs.render('<%= name %>', {name: "The Jones's"});
    assert.equal('The Jones&#39;s', html);
    html = ejs.render('<%= name %>', {name: "&foo_bar;"});
    assert.equal('&amp;foo_bar;', html);
  }

, 'no escaping': function () {
    var val = '&nbsp;<script>'
      , html = ejs.render('<%- name %>', {name: val});
    assert.equal(val, html);
  }

, 'handle no closing tag': function () {
    try {
      ejs.render('foo <%= name bar', {name: 'Bytor'});
    }
    catch(e) {
      console.log(e.message);
      assert.ok(e.message.indexOf('Could not find matching close tag') > -1);
    }
  }

, 'HTML equality': function () {
    assert.equal('<p>yay</p>', render('<p>yay</p>'));
  }

, 'basic conditional': function () {
    var str = '<% if (name) { %><p><%= name %></p><% } %>'
      , actual = render(str, {name: 'mde'});
    assert.equal('<p>mde</p>', actual);
  }

, 'newlines': function () {
    var html = '\n<p>mde</p>\n<p>mde@fleegix.org</p>\n'
      , str = '<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p>\n<% } %>'
      , data = { name: 'mde', email: 'mde@fleegix.org' };
    assert.equal(html, render(str, data));
  }

, 'single quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = "<p><%= up('wahoo') %></p>"
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'single quotes in HTML': function () {
    var html = '<p>WAHOO that\'s cool</p>'
      , str = '<p><%= up(\'wahoo\') %> that\'s cool</p>'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'multiple single quotes': function () {
    var html = "<p>couldn't shouldn't can't</p>"
      , str = "<p>couldn't shouldn't can't</p>";
    assert.equal(html, render(str));
  }

, 'single quotes inside tags': function () {
    var html = '<p>string</p>'
      , str = "<p><%= 'string' %></p>";
    assert.equal(html, render(str));
  }

, 'back-slashes in the document': function () {
    var html = "<p>backslash: '\\'</p>"
      , str = "<p>backslash: '\\'</p>";
    assert.equal(html, render(str));
  }

, 'double quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = '<p><%= up("wahoo") %></p>'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = '<p>just a "test" wahoo</p>';
    assert.equal(html, render(str));
  }

, 'whitespace': function () {
    var users, html, str;

    html = '<p>foo</p>'
    str = '<p><%="foo"%></p>';
    assert.equal(html, render(str));

    html = '<p>foo</p>';
    str = '<p><%=bar%></p>';
    assert.equal(html, render(str, {bar: 'foo'}));

    users = ['geddy', 'neil', 'alex'];
    html = '<ul><li>geddy</li><li>neil</li><li>alex</li></ul>';
    str = '<ul><%users.forEach(function(user){%><li><%=user%></li><%})%></ul>';
    assert.equal(html, render(str, {users: users}));
  }

, 'iteration': function () {
    var html = '<p>foo</p>',
      str = '<% for (var key in items) { %>'
        + '<p><%= items[key] %></p>'
        + '<% } %>';
    assert.equal(html, render(str, {items: ['foo']}));

    var html = '<p>foo</p>',
      str = '<% items.forEach(function (item) { %>'
        + '<p><%= item %></p>'
        + '<% }) %>';
    assert.equal(html, render(str, {items: ['foo']}));
  }

, 'syntax error': function () {
    var str = '<% new Date(1 2); %>';
    try {
      render(str, {});
    }
    catch(e) {
      assert.ok(e.message.indexOf('while compiling EJS') > -1);
    }
  }

, 'useful stack traces': function () {
    var str = [
      "A little somethin'",
      "somethin'",
      "<% if (name) { %>", // Failing line
      "  <p><%= name %></p>",
      "  <p><%= email %></p>",
      "<% } %>"
    ].join("\n");

    try {
      render(str, {}, {filename: 'asdf.js'})
    }
    catch (err) {
      assert.ok(err.message.indexOf("name is not defined") > -1);
      assert.deepEqual(err.name, "ReferenceError");
      var lineno = parseInt(err.toString().match(/asdf.js:(\d+)\n/)[1]);
      assert.deepEqual(lineno, 3,
          "Error should been thrown on line 3, was thrown on line "+ lineno);
    }
  }

, 'useful stack traces multiline': function () {
    var str = [
      "A little somethin'",
      "somethin'",
      "<% var some = 'pretty';",
      "   var multiline = 'javascript';",
      "%>",
      "<% if (name) { %>", // Failing line
      "  <p><%= name %></p>",
      "  <p><%= email %></p>",
      "<% } %>"
    ].join("\n");

    try {
      render(str)
    }
    catch (err) {
      assert.ok(err.message.indexOf("name is not defined") > -1);
      assert.deepEqual(err.name, "ReferenceError");
      var lineno = parseInt(err.toString().match(/ejs:(\d+)\n/)[1]);
      assert.deepEqual(lineno, 6,
          "Error should been thrown on line 6, was thrown on line "+ lineno);
    }
  }

, 'no compileDebug': function () {
    var str = '<% if (foo) {} %>';
    try {
      render(str, {}, {compileDebug: false, filename: 'asdf.js'});
    }
    catch(e) {
      assert.ok(!e.path);
    }
  }

, 'slurp' : function () {
    var expected = 'me\nhere'
      , str = 'me<% %>\nhere';
    assert.equal(expected, render(str));

    var expected = 'mehere'
      , str = 'me<% -%>\nhere';
    assert.equal(expected, render(str));

    var expected = 'me\nhere'
      , str = 'me<% -%>\n\nhere';
    assert.equal(expected, render(str));

    var expected = 'me inbetween \nhere'
      , str = 'me <%= x %> \nhere';
    assert.equal(expected, render(str,{x:'inbetween'}));

    var expected = 'me inbetween here'
      , str = 'me <%= x -%> \nhere';
    assert.equal(expected, render(str, {x:'inbetween'}));

    var expected = 'me <p>inbetween</p> here'
      , str = 'me <%- x -%> \nhere';
    assert.equal(expected, render(str,{x:'<p>inbetween</p>'}));

    var expected = '\n  Hallo 0\n\n  Hallo 1\n\n'
      , str = '<% for (var i in [1,2]) { %>\n' +
            '  Hallo <%= i %>\n' +
            '<% } %>\n';
    assert.equal(expected, render(str));

    var expected = '  Hallo 0\n  Hallo 1\n'
      , str = '<% for (var i in [1,2]) { -%>\n' +
            '  Hallo <%= i %>\n' +
            '<% } -%>\n';
    assert.equal(expected, render(str));
  }

, 'test include directive': function () {
    var tmpl = '<% include fixtures/include %>'
      , html = render(tmpl, {foo: true}, {filename: './test/ejs.js'});
    assert.equal('foo: true', html);
  }

, 'test nested include directive': function () {
    var tmpl = '<% include fixtures/include_a %>'
      , html = render(tmpl, {bar: true}, {filename: './test/ejs.js'});
    assert.equal('Howdy bar: true', html);
  }

, 'test include function': function () {
    var tmpl = '<%= include("fixtures/include"); %>'
      , html = render(tmpl, {foo: true}, {filename: './test/ejs.js'});
    assert.equal('foo: true', html);
  }

, 'test include function variable path': function () {
    var tmpl = '<%= include(includePath); %>'
      , html = render(tmpl, {foo: true, includePath: "fixtures/include"},
            {filename: './test/ejs.js'});
    assert.equal('foo: true', html);
  }

, 'require support': function () {
      var file = 'test/fixtures/include.ejs'
        , template = require('./fixtures/include.ejs');
      assert.equal('foo: true', template({foo: true}));
  }

};

module.exports = tests;
