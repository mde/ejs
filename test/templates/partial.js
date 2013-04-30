require('../../lib/geddy');

var assert = require('assert')
  , Partial = require('../../lib/template/partial').Partial
  , tests;

geddy.templateRegistry = {
  'app/views/foo/baz': {
    file: 'app/views/foo/baz.html.ejs'
  , ext: '.ejs'
  , baseName: 'baz'
  , baseNamePath: 'app/views/foo/baz'
  }

, 'app/views/foo/bar': {
    file: 'app/views/foo/bar.html.ejs'
  , ext: '.ejs'
  , baseName: 'bar'
  , baseNamePath: 'app/views/foo/bar'
  }
};

tests = {

  'relative template path, top-level partial': function () {
    var p = new Partial('foo/bar', {})
      , data = p.getTemplateData();
    assert.ok(data);
  }

, 'relative template path, sub-partial': function () {
    var pParent = new Partial('app/views/foo/baz', {})
    var pSub = new Partial('bar', {}, pParent)
      , data = pSub.getTemplateData();
    assert.ok(data);
  }

};

module.exports = tests;
