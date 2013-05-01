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

var Adapter = require('../../../lib/template/adapters').Adapter
  , assert = require('assert')
  , tests
  , render = function (str, data) {
      data = data || {};
      var adapter = new Adapter({engine: 'ejs', template: str});

      return adapter.render(data);
    };

tests = {

  'test empty template render': function () {
    var actual = render('');
    assert.equal('', actual);
  }

, 'test rendering a single variable': function () {
    var str = "<% var foo = 'FOO'; %><%= foo; %>"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'test rendering passed-in data': function () {
    var str = "<%= foo; %>"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test literal EJS': function () {
    var str = "<%% var foo = 'FOO'; %>"
      , actual = render(str);
    assert.equal("<% var foo = 'FOO'; %>", actual);
  }

, 'test comments': function () {
    var str = "<%# Blah blah blah %><% var foo = 'FOO'; %><%= foo; %>"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'test escaping': function () {
    assert.equal('&lt;script&gt;', render('<%= "<script>" %>'));
    assert.equal('<script>', render('<%- "<script>" %>'));
  }

, 'test HTML equality': function () {
    assert.equal('<p>yay</p>', render('<p>yay</p>'));
  }

, 'test basic conditional': function () {
    var str = '<% if (name) { %><p><%= name %></p><% } %>'
      , actual = render(str, {name: 'mde'});
    assert.equal('<p>mde</p>', actual);
  }

, 'test newlines': function () {
    var html = '\n<p>mde</p>\n<p>mde@fleegix.org</p>\n'
      , str = '<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p>\n<% } %>'
      , data = { name: 'mde', email: 'mde@fleegix.org' };
    assert.equal(html, render(str, data));
  }

, 'test single quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = "<p><%= up('wahoo') %></p>"
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test single quotes in HTML': function () {
    var html = '<p>WAHOO that\'s cool</p>'
      , str = '<p><%= up(\'wahoo\') %> that\'s cool</p>'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple single quotes': function () {
    var html = "<p>couldn't shouldn't can't</p>"
      , str = "<p>couldn't shouldn't can't</p>";
    assert.equal(html, render(str));
  }

, 'test single quotes inside tags': function () {
    var html = '<p>string</p>'
      , str = "<p><%= 'string' %></p>";
    assert.equal(html, render(str));
  }

, 'test back-slashes in the document': function () {
    var html = "<p>backslash: '\\'</p>"
      , str = "<p>backslash: '\\'</p>";
    assert.equal(html, render(str));
  }

, 'test double quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = '<p><%= up("wahoo") %></p>'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = '<p>just a "test" wahoo</p>';
    assert.equal(html, render(str));
  }

, 'test whitespace': function () {
    var html = '<p>foo</p>'
      , str = '<p><%="foo"%></p>';
    assert.equal(html, render(str));

    var html = '<p>foo</p>'
      , str = '<p><%=bar%></p>';
    assert.equal(html, render(str, {bar: 'foo'}));
  }

, 'test iteration': function () {
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

, 'test useful stack traces': function () {
    var str = [
      "A little somethin'",
      "somethin'",
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
      assert.deepEqual(lineno, 3,
          "Error should been thrown on line 3, was thrown on line "+ lineno);
    }
  }

, 'test useful stack traces multiline': function () {
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

, 'test slurp' : function () {
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

};

module.exports = tests;
