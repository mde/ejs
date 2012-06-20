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
  templ = new Adapter({ data: {ext: '.jade'}, text: string, templato: templato });
  templ.process(data);

  return templ.markup;
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
    var str = '- if(name)\n  p= name'
      , actual = render(str, {name: 'mde'});
    assert.equal('<p>mde</p>', actual);
  }

, 'test single quotes': function () {
    var html = '<p>WAHOO</p>'
      , str = "p= up('wahoo')"
      , data = {up: function (str){ return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test single quotes in HTML': function () {
    var html = "<p>WAHOO that's cool</p>"
      , str = "p= up('wahoo')\n |  that's cool"
      , data = {up: function (str){ return str.toUpperCase(); }};
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

, 'test double quotes': function (){
    var html = '<p>WAHOO</p>'
      , str = 'p= up("wahoo")'
      , data = {up: function (str){ return str.toUpperCase(); }};
    assert.equal(html, render(str, data));
  }

, 'test multiple double quotes': function () {
    var html = '<p>just a "test" wahoo</p>'
      , str = 'p just a "test" wahoo';
    assert.equal(html, render(str));
  }

, 'test iteration': function (){
    var html = '<p>foo</p>',
      str = '- for(var i in items)\n  p= items[i]';
    assert.equal(html, render(str, {items: ['foo']}));

    var html = '<p>foo</p>',
      str = '- items.forEach(function(item) {\n  p= item\n- })';
    assert.equal(html, render(str, {items: ['foo']}));
  }

};

for(var p in tests) {
  if(typeof tests[p] == 'function') {
    console.log('Running ' + p);
    tests[p]();
  }
}

