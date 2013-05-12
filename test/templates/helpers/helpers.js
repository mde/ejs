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

var Helpers = require('../../../lib/template/helpers/index')
  , assert = require('assert')
  , helpers = {}
  , tests;

// Assign Helpers actions as a helper
for (var i in Helpers) {
  helpers[i] = Helpers[i].action;
}

// Register dummy data for use with empty path options in urlFor
helpers.registerData({params: {controller: 'tasks', action: 'index'}});

tests = {

  'test link for scriptLink': function () {
    assert.equal(helpers.scriptLink('/js/script.js'), '<script src="/js/script.js"></script>');
  }

, 'test link and options for scriptLink': function () {
    var string = helpers.scriptLink('/js/script.js', {type:'text/javascript'});
    assert.equal(string, '<script src="/js/script.js" type="text/javascript"></script>');
  }

, 'test link for styleLink': function () {
    assert.equal(helpers.styleLink('/css/styles.css'), '<link href="/css/styles.css" />');
  }

, 'test link and options for styleLink': function () {
    var string = helpers.styleLink('/css/styles.css', {rel: 'stylesheet'});
    assert.equal(string, '<link href="/css/styles.css" rel="stylesheet" />');
  }

, 'test paragraph in contentTag': function () {
    assert.equal(helpers.contentTag('p', 'some content'), '<p>some content</p>');
  }

, 'test input in contentTag': function () {
    assert.equal(helpers.contentTag('input', 'sample value'), '<input value="sample value" />');
  }

, 'test override value of input in contentTag': function () {
    var string = helpers.contentTag('input', 'sample value', {value: 'actual val'});
    assert.equal(string, '<input value="actual val" />');
  }

, 'test input with boolean attribute in contentTag': function () {
    var string = helpers.contentTag('input', 'sample value', { autofocus: true });
    assert.equal(string, '<input autofocus="autofocus" value="sample value" />');
  }

, 'test default link from content in contentTag': function () {
    assert.equal(helpers.contentTag('a', 'http://google.com'), '<a href="http://google.com">http://google.com</a>');
  }

, 'test link and provide custom href attribute in contentTag': function () {
    var string = helpers.contentTag('a', 'some content', { href: 'http://google.com' });
    assert.equal(string, '<a href="http://google.com">some content</a>');
  }

, 'test object for data attribute in contentTag': function () {
    var string = helpers.contentTag('a', 'http://google.com', { data: {goTo: 'http://google.com'} });
    assert.equal(string, '<a data-go-to="http://google.com" href="http://google.com">http://google.com</a>');
  }

, 'test array for data in contentTag': function () {
    var string = helpers.contentTag('a', 'http://google.com', { omg: ['odd input'] });
    assert.equal(string, '<a href="http://google.com" omg="odd input">http://google.com</a>');
  }

, 'test array with multiple items for data in contentTag': function () {
    var string = helpers.contentTag('a', 'http://google.com', { omg: ['odd input', 'this is weird'] });
    assert.equal(string, '<a href="http://google.com" omg="odd input this is weird">http://google.com</a>');
  }

, 'test normal data attributes in contentTag': function () {
    var string = helpers.contentTag('a', 'http://google.com', { dataGoTo: 'http://google.com' });
    assert.equal(string, '<a data-go-to="http://google.com" href="http://google.com">http://google.com</a>');
  }

, 'test select tag with array for contentTag': function () {
    var string = helpers.contentTag('select', ['geddy', 'alex', 'neil']);
    assert.equal(string, '<select><option value="geddy">geddy</option><option value="alex">alex</option><option value="neil">neil</option></select>');
  }

, 'test select tag with a string for contentTag': function () {
    var string = helpers.contentTag('select', 'some incorrect content');
    assert.equal(string, '<select>some incorrect content</select>');
  }

, 'test select tag with array of value/text objects for contentTag': function() { 
    var choices = [{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}]
      , string = helpers.contentTag("select", choices);
    assert.equal(string, "<select><option value=\"1\">Text 1</option><option value=\"2\">Text 2</option></select>"); 
  }

, 'test select tag with selected option': function() { 
    var choices = [{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}]
      , string = helpers.selectTag(choices, 2);
    assert.equal(string, "<select><option value=\"1\">Text 1</option><option selected=\"selected\" value=\"2\">Text 2</option></select>"); 
  }

, 'test select tag with html options': function() {
    var choices = [{value: 1, text: "Text 1"}, {value: 2, text: "Text 2"}]
      , string = helpers.selectTag(choices, 2, {class: 'myclass'});
    assert.equal(string, "<select class=\"myclass\"><option value=\"1\">Text 1</option><option selected=\"selected\" value=\"2\">Text 2</option></select>"); 
  }

, 'test select tag with array of text/attrs objects for contentTag': function() {
    var choices = [{text: "Text 1", attrs: {value: 1, data: {thing: "avalue"}}}, {value: 2, text: "Text 2", attrs: {value: 3, data: {thing: "avalue"}}}]
      , string = helpers.contentTag("select", choices);
    assert.equal(string, "<select><option data-thing=\"avalue\" value=\"1\">Text 1</option><option data-thing=\"avalue\" value=\"2\">Text 2</option></select>");
  }

  , 'test select tag with text/attrs and selected option using the seleted param': function() {
    var choices = [{value: 1, text: "Text 1", attrs: {data: {thing: "avalue"}}}, {value: 2, text: "Text 2", attrs: { data: {thing: "avalue"}}}]
      , string = helpers.selectTag(choices, 2);
    assert.equal(string, "<select><option data-thing=\"avalue\" value=\"1\">Text 1</option><option data-thing=\"avalue\" selected=\"selected\" value=\"2\">Text 2</option></select>");
  }

, 'test select tag with text/attrs and selected option using the selected in attrs': function() {
    var choices = [{value: 1, text: "Text 1", attrs: {data: {thing: "avalue"}}}, {value: 2, text: "Text 2", attrs: {selected: true, data: {thing: "avalue"}}}]
      , string = helpers.selectTag(choices);
    assert.equal(string, "<select><option data-thing=\"avalue\" value=\"1\">Text 1</option><option data-thing=\"avalue\" selected=\"selected\" value=\"2\">Text 2</option></select>");
  }

, 'test select tag with text/attrs and selected option using a selected in attrs and an outer one too to make sure the outer takes precedence': function() {
    var choices = [{value: 1, text: "Text 1", attrs: {data: {thing: "avalue"}, selected: true}}, {value: 2, text: "Text 2", attrs: {data: {thing: "avalue"}}}]
      , string = helpers.selectTag(choices, 2);
    assert.equal(string, "<select><option data-thing=\"avalue\" value=\"1\">Text 1</option><option data-thing=\"avalue\" selected=\"selected\" value=\"2\">Text 2</option></select>");
  }

, 'test single tags in truncateHTML': function () {
    var string = helpers.truncateHTML('<p>Once upon a time in a world</p>', { length: 10 });
    assert.equal(string, '<p>Once up...</p>');
  }

, 'test multiple tags in truncateHTML': function () {
    var string = helpers.truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 });
    assert.equal(string, '<p>Once up...<small>in a wo...</small></p>');
  }

, 'test multiple tags but only truncate once in truncateHTML': function () {
    var string = helpers.truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true });
    assert.equal(string, '<p>Once up...<small>in a world</small></p>');
  }

, 'test standard truncate': function () {
    var string = helpers.truncate('Once upon a time in a world', { length: 10 });
    assert.equal(string, 'Once up...');
  }

, 'test custom omission in truncate': function () {
    var string = helpers.truncate('Once upon a time in a world', { length: 10, omission: '///' });
    assert.equal(string, 'Once up///');
  }

, 'test regex seperator in truncate': function () {
    var string = helpers.truncate('Once upon a time in a world', { length: 15, seperator: /\s/ });
    assert.equal(string, 'Once upon a...');
  }

, 'test string seperator in truncate': function () {
    var string = helpers.truncate('Once upon a time in a world', { length: 15, seperator: ' ' });
    assert.equal(string, 'Once upon a...');
  }

, 'test unsafe html in truncate': function () {
    var string = helpers.truncate('<p>Once upon a time in a world</p>', { length: 20 });
    assert.equal(string, '<p>Once upon a ti...');
  }

, 'test standard for imageLink': function () {
    var string = helpers.imageLink('images/google.png', 'http://google.com');
    assert.equal(string, '<a href="http://google.com"><img alt="images/google.png" src="images/google.png" /></a>');
  }

, 'test custom alt text for image in imageLink': function () {
    var string = helpers.imageLink('images/google.png', 'http://google.com', { alt: '' });
    assert.equal(string, '<a href="http://google.com"><img alt="" src="images/google.png" /></a>');
  }

, 'test custom alt text for image and using custom size option in imageLink': function () {
    var string = helpers.imageLink('images/google.png', 'http://google.com', { alt: '', size: '40x50' });
    assert.equal(string, '<a href="http://google.com"><img alt="" height="50" src="images/google.png" width="40" /></a>');
  }

, 'test custom alt text for image and data object for link in imageLink': function () {
    var string = helpers.imageLink('images/google.png', 'http://google.com', { alt: '' }, { data: {goTo: 'http://google.com'} });
    assert.equal(string, '<a data-go-to="http://google.com" href="http://google.com"><img alt="" src="images/google.png" /></a>');
  }

, 'test standard for imageTag': function () {
    var string = helpers.imageTag('images/google.png');
    assert.equal(string, '<img alt="images/google.png" src="images/google.png" />');
  }

, 'test custom alt text for image in imageTag': function () {
    var string = helpers.imageTag('images/google.png', { alt: '' });
    assert.equal(string, '<img alt="" src="images/google.png" />');
  }

, 'test custom size attribute for image in imageTag': function () {
    var string = helpers.imageTag('images/google.png', { size: '40x50' });
    assert.equal(string, '<img alt="images/google.png" height="50" src="images/google.png" width="40" />');
  }

, 'test malformed size attribute for image in imageTag': function () {
    var string = helpers.imageTag('images/google.png', { size: 'a string' });
    assert.equal(string, '<img alt="images/google.png" src="images/google.png" />');
  }

, 'test standard in linkTo': function () {
    var string = helpers.linkTo('some content', 'http://google.com');
    assert.equal(string, '<a href="http://google.com">some content</a>');
  }

, 'test data object in linkTo': function () {
    var string = helpers.linkTo('some content', 'http://google.com', { data: {goTo: 'http://google.com'} });
    assert.equal(string, '<a data-go-to="http://google.com" href="http://google.com">some content</a>');
  }

, 'test string in urlFor': function () {
    var string = 'http://google.com';
    assert.equal(helpers.urlFor(string), string);
  }

, 'test simple host in urlFor': function () {
    var object = { host: 'somehost.com' }
      , result = 'http://somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test auth included with URL in urlFor': function () {
    var object = { host: 'somehost.com', username: 'username', password: 'password' }
      , result = 'http://username:password@somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test subdomain with host in urlFor': function () {
    var object = { host: 'somehost.com', subdomain: 'user' }
      , result = 'http://user.somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test subdomain with domain in urlFor': function () {
    var object = { domain: 'somehost.com', subdomain: 'user' }
      , result = 'http://user.somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test simple host with controller and action in urlFor': function () {
    var object = { controller: 'tasks', action: 'new', host: 'somehost.com' }
      , result = 'http://somehost.com/tasks/new';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test relative path with controller and action in urlFor': function () {
    var object = { controller: 'tasks', action: 'new', relPath: true }
      , result = '/tasks/new';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test no relPath set explicitly in urlFor': function () {
    var object = { controller: 'tasks', action: 'new' }
      , result = '/tasks/new';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test empty controller with action in urlFor': function () {
    var object = { action: 'new' }
      , result = '/tasks/new';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test empty controller and action with id in urlFor': function () {
    var object = { id: '123' }
      , result = '/tasks/123';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test empty controller with id and action in urlFor': function () {
    var object = { id: '123', action: 'edit' }
      , result = '/tasks/123/edit';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test empty action with controller and id in urlFor': function () {
    var object = { controller: 'tasks', id: '123' }
      , result = '/tasks/123';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test https protocol in urlFor': function () {
    var object = { host: 'somehost.com', protocol: 'https' }
      , result = 'https://somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test single query in urlFor': function () {
    var object = { host: 'somehost.com', controller: 'tasks', action: 'new', authToken: 'some_token' }
      , result = 'http://somehost.com/tasks/new?authToken=some_token';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test multiple query in urlFor': function () {
    var object = { host: 'somehost.com', controller: 'tasks', action: 'new', authToken: 'some_token', date: '6232012' }
      , result = 'http://somehost.com/tasks/new?authToken=some_token&date=6232012';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test fragments in urlFor': function () {
    var object = { host: 'somehost.com', anchor: 'submit' }
      , result = 'http://somehost.com#submit';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test file protocol in urlFor': function () {
    var object = { host: 'somehost.com', protocol: 'file' }
      , result = 'file:///somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

, 'test alternative slashed protocol in urlFor': function () {
    var object = { host: 'somehost.com', protocol: 'z39.50r' }
      , result = 'z39.50r://somehost.com';
    assert.equal(helpers.urlFor(object), result);
  }

};

module.exports = tests;
