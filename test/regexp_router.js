// Load the basic Geddy toolkit
require('../lib/geddy');

var Router = require('../lib/routers/regexp_router').RegExpRouter
  , assert = require('assert')
  , tests;

tests = {
 // create a router
  testCreateRouter: function() {
    router = new Router();
    assert.ok(router);
  },

  // create a simple route
  testCreateSimpleRoute: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id');
    assert.ok(route);
  },

  // create a route with optional segments
  testCreateOptionalRoute: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)')
    assert.ok(route)
  },

  // create a route with multiple optional segments
  testCreateMultipleOptionalRoute: function() {
    router = new Router();
    var route = router.match('/:controller/:id(/:action)(.:format)')
    assert.ok(route)
  },

  // create a resource
  testCreateResource: function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    assert.ok(routes.length === 7)
    for ( var i in routes ) {
      assert.ok(route)
    }
  },

  // create a static route with fixed params
  testRouteWithParams: function() {
    router = new Router();
    var route = router.match('/hello/there').to( { controller:'Application', action: 'index' } );
    assert.ok(route)
  },

  // create a static route with extra fixed params
  testRouteWithExtraParams: function() {
    router = new Router();
    var route = router.match('/hello/there').to( { controller:'Application', action: 'index', language: 'english' } );
    assert.ok(route)
  },

  // create a static route with a specific request method
  testRouteWithMethod: function() {
    router = new Router();
    var route = router.match('/:controller/:action', 'GET');
    assert.ok(route)
  },

  // create a static route with key regex match requirements
  testRouteWithRegexReqs: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ } );
    assert.ok(route)
  },

  // create a static route with key match requirements as a regex string
  testRouteWithStringRegexReqs: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: '\\d+' } );
    assert.ok(route)
  },

  // create a static route with key match requirements AND a method
  testRouteWithReqsAndMethod: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', 'GET', { id: /\d+/ } );
    assert.ok(route)
  },

  // create a static route with key match requirements AND a method in reverse order
  testRouteWithReqsAndMethodReversed: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ }, 'GET' );
    assert.ok(route)
  },

  // create a static route with key match requirements AND a method in reverse order
  testRouteWithName: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ }, 'GET' ).name('aweosme');
    assert.ok(route)
  },


// ok - let's start doing things with these routes

  // test that the router matches a URL
  testSimpleRouteParses: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id');
    var params = router.first({url: '/products/show/1'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(params.id, 1);
    assert.equal(params.method, 'GET');
  },

  // test that the router matches a URL
  testSimpleRouteParsesWithOptionalSegment: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)');
    var params = router.first({url: '/products/show/1.html'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(params.id, 1);
    assert.equal(params.method, 'GET');
    assert.equal(params.format, 'html');
  },

  testSimpleRouteParsesWithOptionalSegmentMissing: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)','GET');
    var params = router.first({url: '/products/show/1'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(params.id, 1);
    assert.equal(params.method, 'GET');
    assert.equal(typeof(params.format), 'undefined');
  },

  testSimpleRouteFailingDueToBadMethod: function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)','GET');
    var params = router.first({url: '/products/show/1'},'POST');
    assert.equal(params, false);
  },

  testSimpleRouteWithTwoOptionalSegments: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first({url: '/products/show'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(typeof(params.id), 'undefined');
    assert.equal(typeof(params.format), 'undefined');
    assert.equal(params.method, 'GET');
  },

  testSimpleRouteWithTwoOptionalSegmentsWithFirstUsed: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first({url: '/products/show/1'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(params.id, 1);
    assert.equal(typeof(params.format), 'undefined');
    assert.equal(params.method, 'GET');
  },

  testSimpleRouteWithTwoOptionalSegmentsWithSecondUsed: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first({url: '/products/show.html'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(typeof(params.id), 'undefined');
    assert.equal(params.format, 'html');
    assert.equal(params.method, 'GET');
  },

  testSimpleRouteWithTwoOptionalSegmentsWithBothUsed: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first({url: '/products/show/1.html'},'GET');
    assert.ok(params);
    assert.equal(params.controller, 'Products');
    assert.equal(params.action, 'show');
    assert.equal(params.id, 1);
    assert.equal(params.format, 'html');
    assert.equal(params.method, 'GET');
  },

// fuck, how repetitive. how about methods for a bit?

  testGET: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first({url: '/products/show/1.html'},'GET');
    assert.ok(params);
    assert.equal(params.method, 'GET');
  },

  testPOST: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','POST');
    var params = router.first({url: '/products/show/1.html'},'POST');
    assert.ok(params);
    assert.equal(params.method, 'POST');
  },

  testPUT: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','PUT');
    var params = router.first({url: '/products/show/1.html'},'PUT');
    assert.ok(params);
    assert.equal(params.method, 'PUT');
  },

  testDELETE: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','DELETE');
    var params = router.first({url: '/products/show/1.html'},'DELETE');
    assert.ok(params);
    assert.equal(params.method, 'DELETE');
  },

// that was fun. Let's do a little resource testing

  testResourceMatches: function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    // index
    assert.ok(router.first({url: '/snow_dogs'},'GET'));
    assert.ok(router.first({url: '/snow_dogs.html'},'GET'));
    assert.equal(router.first({url:'/snow_dogs'},'GET').action, 'index');
    // show
    assert.ok(router.first({url:'/snow_dogs/1'},'GET'));
    assert.ok(router.first({url:'/snow_dogs/1.html'},'GET'));
    assert.equal(router.first({url:'/snow_dogs/1'},'GET').action, 'show');
    // add form
    assert.ok(router.first({url:'/snow_dogs/add'},'GET'));
    assert.ok(router.first({url:'/snow_dogs/add.html'},'GET'));
    assert.equal(router.first({url:'/snow_dogs/add'},'GET').action, 'add');
    // edit form
    assert.ok(router.first({url:'/snow_dogs/1/edit'},'GET'));
    assert.ok(router.first({url:'/snow_dogs/1/edit.html'},'GET'));
    assert.equal(router.first({url:'/snow_dogs/1/edit'},'GET').action, 'edit');
    // create
    assert.ok(router.first({url:'/snow_dogs'},'POST'));
    assert.ok(router.first({url:'/snow_dogs.html'},'POST'));
    assert.equal(router.first({url:'/snow_dogs'},'POST').action, 'create');
    // update
    assert.ok(router.first({url:'/snow_dogs/1'},'PUT'));
    assert.ok(router.first({url:'/snow_dogs/1.html'},'PUT'));
    assert.equal(router.first({url:'/snow_dogs/1'},'PUT').action, 'update');
    // delete
    assert.ok(router.first({url:'/snow_dogs/1'},'DELETE'));
    assert.ok(router.first({url:'/snow_dogs/1.html'},'DELETE'));
    assert.equal(router.first({url:'/snow_dogs/1'},'DELETE').action, 'remove');
  },

// url generation time nao

  testResourceUrlGeneration: function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    // index
    assert.equal(router.url( { controller:'SnowDogs', action:'index' } ), '/snow_dogs');
    assert.equal(router.url( { controller:'SnowDogs', action:'index', format: 'html' } ), '/snow_dogs.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'index', format: 'json' } ), '/snow_dogs.json');
    // show
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1 } ), '/snow_dogs/1');
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1, format: 'html' } ), '/snow_dogs/1.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1, format: 'json' } ), '/snow_dogs/1.json');
    // add form
    assert.equal(router.url( { controller:'SnowDogs', action:'add' } ), '/snow_dogs/add');
    assert.equal(router.url( { controller:'SnowDogs', action:'add', format: 'html' } ), '/snow_dogs/add.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'add', format: 'json' } ), '/snow_dogs/add.json');
    // edit form
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1 } ), '/snow_dogs/1/edit');
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1, format: 'html' } ), '/snow_dogs/1/edit.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1, format: 'json' } ), '/snow_dogs/1/edit.json');
    // create
    assert.equal(router.url( { controller:'SnowDogs', action:'create' } ), '/snow_dogs');
    assert.equal(router.url( { controller:'SnowDogs', action:'create', format: 'html' } ), '/snow_dogs.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'create', format: 'json' } ), '/snow_dogs.json');
    // update
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1 } ), '/snow_dogs/1');
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1, format: 'html' } ), '/snow_dogs/1.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1, format: 'json' } ), '/snow_dogs/1.json');
    // delete
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1 } ), '/snow_dogs/1');
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1, format: 'html' } ), '/snow_dogs/1.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1, format: 'json' } ), '/snow_dogs/1.json');

  },

  testRouteUrlGeneration: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet' } ), '/snow_dogs/pet');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5 } ), '/snow_dogs/pet/5');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5, format:'html' } ), '/snow_dogs/pet/5.html');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5, format:'json' } ), '/snow_dogs/pet/5.json');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', format:'html' } ), '/snow_dogs/pet.html');

  },

  testDefaultValues: function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)');
    assert.equal(router.url(), '/application/index');
  }
};

for (var p in tests) {
  if (typeof tests[p] == 'function') {
    console.log('Running ' + p);
    tests[p]();
  }
}


