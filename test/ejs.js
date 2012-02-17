// Load the basic Geddy toolkit
require('../lib/geddy');

var Template = require('../lib/template/adapters/ejs/template.js').Template
  , assert = require('assert')
  , tests;

tests = new (function () {

  this.testRenderVar = function () {
    // Create a template out of the markup in the file
    var templ = new Template({text: "<% var foo = 'FOO'; %><%= foo; %>"});
    templ.process({data: {}});
    assert.equal('FOO', templ.markup);
  };

  this.testRenderData = function () {
    // Create a template out of the markup in the file
    var templ = new Template({text: "<%= foo; %>"});
    templ.process({data: {foo: 'FOO'}});
    assert.equal('FOO', templ.markup);
  };

  this.testEscapeData = function () {
    // Create a template out of the markup in the file
    var templ = new Template({text: "<%= foo; %>"});
    templ.process({data: {foo: '<FOO>'}});
    assert.equal('&lt;FOO&gt;', templ.markup);
  };

})();

for (var p in tests) {
  if (typeof tests[p] == 'function') {
    console.log('Running ' + p);
    tests[p]();
  }
}

