var sys       = require ('sys');
var assert    = require('assert');
var gRouter   = require('../router');

//Load util libraries
GLOBAL.util = {};
GLOBAL.util.meta = require('geddy-util/lib/meta');
GLOBAL.util.string = require('geddy-util/lib/string');

RouterTests = {
  //pass and fail messages to be used in reporting success or failure
  pass : 'Pass',
  fail : 'Failed',
  
  //basic test setup
  setup : function(opts) {
    return function() {
      router = new gRouter.Router();
    }();
  },

  //tear down must be run at the completion of every test
  teardown : function(test) {
    sys.p('PASSED  ::  ' + test);
    return function() {
      process.addListener("exit", function () {
        assert.equal(0, exitStatus);
      })();
    }
  },

  //generate route for action tests
  generateRoute : function(resource, action, method) {
    router.match('/' + resource).to({controller: resource, action: action }).name(resource);
    return router.parse('/' + resource, method);
  },

  
  testCreateRouter : function() {
    assert.ok(router !== undefined, this.fail);
  },

  testMatchFunc : function() {
    var route = router.match('/foo/1/bar/1').to({controller: 'foo', action: 'bar'}); //need to match an actual path
    assert.ok(route.controller === 'foo', this.fail);
    assert.ok(route.action === 'bar', this.fail); 
  },

  //tests for each the restful actions.
  testIndexAction : function() {
    action = this.generateRoute('articles', 'index', 'GET');
    assert.ok(action.params.action === 'index', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'GET', this.fail);
  },

  testAddAction : function() {
    action = this.generateRoute('articles', 'add', 'GET');
    assert.ok(action.params.action === 'add', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'GET', this.fail);
  },

  testCreateAction : function() {
    action = this.generateRoute('articles', 'create', 'POST');
    assert.ok(action.params.action === 'create', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'POST', this.fail);
  },

  testShowAction : function() {
    action = this.generateRoute('articles', 'show', 'GET');
    assert.ok(action.params.action === 'show', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'GET', this.fail);
  },

  testEditAction : function() {
    action = this.generateRoute('articles', 'edit', 'GET');
    assert.ok(action.params.action === 'edit', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'GET', this.fail);
  },

  testUpdateAction : function() {
    action = this.generateRoute('articles', 'update', 'PUT');
    assert.ok(action.params.action === 'update', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'PUT', this.fail);
  },

  testDeleteAction : function() {
    action = this.generateRoute('articles', 'delete', 'DELETE');
    assert.ok(action.params.action === 'delete', this.fail);
    assert.ok(action.params.controller === 'articles', this.fail);
    assert.ok(action.params.method === 'DELETE', this.fail);
  },
  
  testNonMatchingAction : function() {
    action = this.generateRoute('articles', 'nonmatching', 'GET');
    assert.ok(action.params.action !== 'delete', this.fail);
    assert.ok(action.params.controller !== '', this.fail);
    assert.ok(action.params.method !== 'DELETE', this.fail);
  }
}

for(e in RouterTests) {
  if (e.match(/test/)) {
    RouterTests.fail = "FAILED  :: " + e; 
    RouterTests.setup();
    RouterTests[e]();
    RouterTests.teardown(e)
  }
}
