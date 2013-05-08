try {
  require('swig');
} catch (err) {
  var events = new (require('events').EventEmitter)

  events.emit('error', err);
}

var Adapter = require('../../../lib/template/adapters').Adapter
  , assert = require('assert')
  , tests
  , render = function (str, data) {
      data = data || {};
      var adapter = new Adapter({engine: 'swig', template: str});

      return adapter.render(data);
    };

tests = {

  'test rendering passed-in data': function () {
    var str = "{{foo}}"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test comments': function () {
    var str = "{# Blah blah blah #}{{foo}}"
      , actual = render(str, {foo: 'FOO'});
    assert.equal('FOO', actual);
  }

, 'test escaping': function () {
    assert.equal('&lt;script&gt;', render('{{script}}', {script: "<script>"}));
    assert.equal('<script>', render('{% autoescape false %}{{script}}{% endautoescape %}', {script: "<script>"}));
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
      , str = '<p>{{"wahoo"|upper}}</p>'
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
      str = '<p>{% for item in items %}{{item.foo}}{% endfor %}</p>';
    assert.equal(html, render(str, {items: [{foo: 'foo'}]}));
  }

};

module.exports = tests;
