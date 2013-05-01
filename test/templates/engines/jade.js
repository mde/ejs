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

try {
  require('jade');
} catch (err) {
  var events = new (require('events').EventEmitter)

  events.emit('error', err);
}

var Adapter = require('../../../lib/template/adapters').Adapter
  , assert = require('assert')
  , tests
  , render = function (str, data) {
      data = data || {};
      var adapter = new Adapter({engine: 'jade', template: str});

      return adapter.render(data);
    };

tests = {

  'test rendering a single variable': function () {
    var str = "- var foo = 'FOO'\n= foo"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'test rendering passed-in data': function () {
    var str = "= foo"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test comments': function () {
    var str = "//- Blah blah blah\n- var foo = 'FOO'\n= foo"
      , actual = render(str);
    assert.equal('FOO', actual);
  }

, 'test escaping': function () {
    assert.equal('&lt;script&gt;', render('= "<script>"'));
    assert.equal('<script>', render('!= "<script>"'));
  }

, 'test HTML equality': function () {
    assert.equal('<p>yay</p>', render('<p>yay</p>'));
  }

, 'test basic conditional': function () {
    var str = '- if (name)\n  p= name'
      , actual = render(str, {name: 'mde'});
    assert.equal('<p>mde</p>', actual);
  }

, 'test single quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = "p= up('wahoo')"
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test single quotes in HTML': function () {
    var html = "<p>WAHOO that's cool</p>"
      , str = "p= up('wahoo')\n |  that's cool"
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple single quotes': function () {
    var html = "<p>couldn't shouldn't can't</p>"
      , str = "p couldn't shouldn't can't";
    assert.equal(html, render(str));
  }

, 'test back-slashes in the document': function () {
    var html = "<p>backslash: '\\'</p>"
      , str = "p backslash: '\\'";
    assert.equal(html, render(str));
  }

, 'test double quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = 'p= up("wahoo")'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = 'p just a "test" wahoo';
    assert.equal(html, render(str));
  }

, 'test iteration': function () {
    var html = '<p>foo</p>',
      str = '- for (var i in items)\n  p= items[i]';
    assert.equal(html, render(str, {items: ['foo']}));

    var html = '<p>foo</p>',
      str = '- items.forEach(function (item) {\n  p= item\n- })';
    assert.equal(html, render(str, {items: ['foo']}));
  }

};

module.exports = tests;
