// Load the basic Geddy toolkit
require('../lib/geddy');

var Templato = require('../deps/templato')
  , Adapter = require('../lib/template/adapters').Adapter
  , assert = require('assert')
  , tests
  , render;

render = function(string, data) {
  var templato = new Templato
    , templ;
  data = data || {};
  templ = new Adapter({ data: {ext: '.hbs'}, text: string, templato: templato });
  templ.process(data);

  return templ.markup;
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

, 'test double quotes': function (){
    var html = '<p>WAHOO</p>'
      , str = '<p>{{up "wahoo"}}</p>'
      , data = {up: function (str){ return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = '<p>just a "test" wahoo</p>';
    assert.equal(html, render(str));
  }

, 'test iteration': function (){
    var html = '<p>foo</p>',
      str = '<p>{{#items}}{{foo}}{{/items}}</p>';
    assert.equal(html, render(str, {items: [{foo: 'foo'}]}));
  }

};

for(var p in tests) {
  if(typeof tests[p] == 'function') {
    console.log('Running ' + p);
    tests[p]();
  }
}

