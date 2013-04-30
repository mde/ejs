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
  require('handlebars');
} catch (err) {
  var events = new (require('events').EventEmitter)

  events.emit('error', err);
}

var Adapter = require('../../../lib/template/adapters').Adapter
  , assert = require('assert')
  , tests
  , render = function (str, data) {
      data = data || {};
      var adapter = new Adapter({engine: 'handlebars', template: str});

      return adapter.render(data);
    };

tests = {

  'test rendering passed-in data': function () {
    var str = "{{foo}}"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test comments': function () {
    var str = "{{! Blah blah blah }}{{foo}}"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test escaping': function () {
    assert.equal('&lt;script&gt;', render('{{script}}', {script: "<script>"}));
    assert.equal('<script>', render('{{{script}}}', {script: "<script>"}));
  }

, 'test HTML equality': function () {
    assert.equal('<p>yay</p>', render('<p>yay</p>'));
  }

, 'test back-slashes in the document': function () {
    var html = "<p>backslash: '\\'</p>"
      , str = "<p>backslash: '\\'</p>";
    assert.equal(html, render(str));
  }

, 'test double quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = '<p>{{up "wahoo"}}</p>'
      , data = {up: function (str) { return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = '<p>just a "test" wahoo</p>';
    assert.equal(html, render(str));
  }

, 'test iteration': function () {
    var html = '<p>foo</p>',
      str = '<p>{{#items}}{{foo}}{{/items}}</p>';
    assert.equal(html, render(str, {items: [{foo: 'foo'}]}));
  }

, 'test hash arguments' : function () {
    var html = 'foobar.com/main/index'
      , tpl = "{{url host='foobar.com' controller='main' action='index'}}"
      , helper, adapter;

    helper = function (options) {
      return options.host + '/' + options.controller + '/' + options.action
    };

    adapter = new Adapter({engine: 'handlebars', template: tpl});
    adapter.registerHelper('url', helper);

    assert.equal(html, adapter.render());
  }

};

module.exports = tests;
