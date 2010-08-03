logan.namespace('geddy');
logan.namespace('geddy.util');

geddy.util.meta = require('../../geddy-util/lib/meta');
geddy.util.string = require('../../geddy-util/lib/string');

var Router = require('../lib/router').Router;

routerTests = {
 // create a router 
  testCreateRouter : function() {
    router = new Router();
    assert.ok(router, this.fail);
  },

  // create a simple route
  testCreateSimpleRoute : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id');
    assert.ok(route, this.fail);
  },

  // create a route with optional segments
  testCreateOptionalRoute : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)')
    assert.ok(route, this.fail)
  },

  // create a route with multiple optional segments
  testCreateMultipleOptionalRoute : function() {
    router = new Router();
    var route = router.match('/:controller/:id(/:action)(.:format)')
    assert.ok(route, this.fail)
  },

  // create a resource
  testCreateResource : function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    assert.ok(routes.length === 7, this.fail)
    for ( var i in routes ) {
      assert.ok(route, this.fail)
    }
  },

  // create a static route with fixed params 
  testRouteWithParams : function() {
    router = new Router();
    var route = router.match('/hello/there').to( { controller:'Application', action: 'index' } );
    assert.ok(route, this.fail)
  },

  // create a static route with extra fixed params 
  testRouteWithExtraParams : function() {
    router = new Router();
    var route = router.match('/hello/there').to( { controller:'Application', action: 'index', language: 'english' } );
    assert.ok(route, this.fail)
  },

  // create a static route with a specific request method 
  testRouteWithMethod : function() {
    router = new Router();
    var route = router.match('/:controller/:action', 'GET');
    assert.ok(route, this.fail)
  },

  // create a static route with key regex match requirements
  testRouteWithRegexReqs : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ } );
    assert.ok(route, this.fail)
  },

  // create a static route with key match requirements as a regex string
  testRouteWithStringRegexReqs : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: '\\d+' } );
    assert.ok(route, this.fail)
  },

  // create a static route with key match requirements AND a method
  testRouteWithReqsAndMethod : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', 'GET', { id: /\d+/ } );
    assert.ok(route, this.fail)
  },

  // create a static route with key match requirements AND a method in reverse order
  testRouteWithReqsAndMethodReversed : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ }, 'GET' );
    assert.ok(route, this.fail)
  },

  // create a static route with key match requirements AND a method in reverse order
  testRouteWithName : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id', { id: /\d+/ }, 'GET' ).name('aweosme');
    assert.ok(route, this.fail)
  },


// ok - let's start doing things with these routes

  // test that the router matches a URL
  testSimpleRouteParses : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id');
    var params = router.first('/products/show/1','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(params.id, 1, this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },

  // test that the router matches a URL
  testSimpleRouteParsesWithOptionalSegment : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)');
    var params = router.first('/products/show/1.html','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(params.id, 1, this.fail);
    assert.equal(params.method, 'GET', this.fail);
    assert.equal(params.format, 'html', this.fail);
  },

  testSimpleRouteParsesWithOptionalSegmentMissing : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)','GET');
    var params = router.first('/products/show/1','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(params.id, 1, this.fail);
    assert.equal(params.method, 'GET', this.fail);
    assert.equal(typeof(params.format), 'undefined', this.fail);
  },

  testSimpleRouteFailingDueToBadMethod : function() {
    router = new Router();
    var route = router.match('/:controller/:action/:id(.:format)','GET');
    var params = router.first('/products/show/1','POST');
    assert.equal(params, false, this.fail);
  },

  testSimpleRouteWithTwoOptionalSegments : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first('/products/show','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(typeof(params.id), 'undefined', this.fail);
    assert.equal(typeof(params.format), 'undefined', this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },

  testSimpleRouteWithTwoOptionalSegmentsWithFirstUsed : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first('/products/show/1','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(params.id, 1, this.fail);
    assert.equal(typeof(params.format), 'undefined', this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },

  testSimpleRouteWithTwoOptionalSegmentsWithSecondUsed : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first('/products/show.html','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(typeof(params.id), 'undefined', this.fail);
    assert.equal(params.format, 'html', this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },

  testSimpleRouteWithTwoOptionalSegmentsWithBothUsed : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first('/products/show/1.html','GET');
    assert.ok(params, this.fail);
    assert.equal(params.controller, 'Products', this.fail);
    assert.equal(params.action, 'show', this.fail);
    assert.equal(params.id, 1, this.fail);
    assert.equal(params.format, 'html', this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },

// fuck, how repetitive. how about methods for a bit?
  
  testGET : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','GET');
    var params = router.first('/products/show/1.html','GET');
    assert.ok(params, this.fail);
    assert.equal(params.method, 'GET', this.fail);
  },
  
  testPOST : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','POST');
    var params = router.first('/products/show/1.html','POST');
    assert.ok(params, this.fail);
    assert.equal(params.method, 'POST', this.fail);
  },
  
  testPUT : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','PUT');
    var params = router.first('/products/show/1.html','PUT');
    assert.ok(params, this.fail);
    assert.equal(params.method, 'PUT', this.fail);
  },
  
  testDELETE : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)','DELETE');
    var params = router.first('/products/show/1.html','DELETE');
    assert.ok(params, this.fail);
    assert.equal(params.method, 'DELETE', this.fail);
  },
  
// that was fun. Let's do a little resource testing
  
  testResourceMatches : function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    // index
    assert.ok(router.first('/snow_dogs','GET'), this.fail);
    assert.ok(router.first('/snow_dogs.html','GET'), this.fail);
    assert.equal(router.first('/snow_dogs','GET').action, 'index', this.fail);
    // show
    assert.ok(router.first('/snow_dogs/1','GET'), this.fail);
    assert.ok(router.first('/snow_dogs/1.html','GET'), this.fail);
    assert.equal(router.first('/snow_dogs/1','GET').action, 'show', this.fail);
    // add form
    assert.ok(router.first('/snow_dogs/add','GET'), this.fail);
    assert.ok(router.first('/snow_dogs/add.html','GET'), this.fail);
    assert.equal(router.first('/snow_dogs/add','GET').action, 'add', this.fail);
    // edit form
    assert.ok(router.first('/snow_dogs/1/edit','GET'), this.fail);
    assert.ok(router.first('/snow_dogs/1/edit.html','GET'), this.fail);
    assert.equal(router.first('/snow_dogs/1/edit','GET').action, 'edit', this.fail);
    // create
    assert.ok(router.first('/snow_dogs','POST'), this.fail);
    assert.ok(router.first('/snow_dogs.html','POST'), this.fail);
    assert.equal(router.first('/snow_dogs','POST').action, 'create', this.fail);
    // update
    assert.ok(router.first('/snow_dogs/1','PUT'), this.fail);
    assert.ok(router.first('/snow_dogs/1.html','PUT'), this.fail);
    assert.equal(router.first('/snow_dogs/1','PUT').action, 'update', this.fail);
    // delete
    assert.ok(router.first('/snow_dogs/1','DELETE'), this.fail);
    assert.ok(router.first('/snow_dogs/1.html','DELETE'), this.fail);
    assert.equal(router.first('/snow_dogs/1','DELETE').action, 'remove', this.fail);
  },

// url generation time nao

  testResourceUrlGeneration : function() {
    router = new Router();
    var routes = router.resource('SnowDogs');
    // index
    assert.equal(router.url( { controller:'SnowDogs', action:'index' } ), '/snow_dogs', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'index', format: 'html' } ), '/snow_dogs.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'index', format: 'json' } ), '/snow_dogs.json', this.fail);
    // show
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1 } ), '/snow_dogs/1', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1, format: 'html' } ), '/snow_dogs/1.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'show', id:1, format: 'json' } ), '/snow_dogs/1.json', this.fail);
    // add form
    assert.equal(router.url( { controller:'SnowDogs', action:'add' } ), '/snow_dogs/add', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'add', format: 'html' } ), '/snow_dogs/add.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'add', format: 'json' } ), '/snow_dogs/add.json', this.fail);
    // edit form
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1 } ), '/snow_dogs/1/edit', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1, format: 'html' } ), '/snow_dogs/1/edit.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'edit', id:1, format: 'json' } ), '/snow_dogs/1/edit.json', this.fail);
    // create
    assert.equal(router.url( { controller:'SnowDogs', action:'create' } ), '/snow_dogs', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'create', format: 'html' } ), '/snow_dogs.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'create', format: 'json' } ), '/snow_dogs.json', this.fail);
    // update
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1 } ), '/snow_dogs/1', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1, format: 'html' } ), '/snow_dogs/1.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'update', id:1, format: 'json' } ), '/snow_dogs/1.json', this.fail);
    // delete
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1 } ), '/snow_dogs/1', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1, format: 'html' } ), '/snow_dogs/1.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'remove', id:1, format: 'json' } ), '/snow_dogs/1.json', this.fail);

  },

  testRouteUrlGeneration : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)');
    assert.equal(router.url( { controller:'SnowDogs', action:'pet' } ), '/snow_dogs/pet', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5 } ), '/snow_dogs/pet/5', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5, format:'html' } ), '/snow_dogs/pet/5.html', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', id:5, format:'json' } ), '/snow_dogs/pet/5.json', this.fail);
    assert.equal(router.url( { controller:'SnowDogs', action:'pet', format:'html' } ), '/snow_dogs/pet.html', this.fail);

  },

  testDefaultValues : function() {
    router = new Router();
    var route = router.match('/:controller/:action(/:id)(.:format)');
    assert.equal(router.url(), '/application/index', this.fail);
  }
};

logan.run(routerTests);

