/* This is for documentation purposes only.
 * If you are making a router, you should minimally
 * provide this interface. */
var url = require('url');

var BaseRouter = function (routes) {
  this.routes = [];
  if (routes) {
    this.setRoutes(routes);
  }
};

/*  This should be in the documented format for your router  */
BaseRouter.prototype = new (function () {
  this.setRoutes = function (routes) {
    var route
      , pattern
      , method
      , handler;
    for (var i = 0, ii = routes.length; i < ii; i++) {
      route = routes[i];
      // Grab pattern and handler
      pattern = route.shift();
      handler = route.pop();
      // May have a method
      method = route.shift();
      this.match(pattern, method).to(handler);
    }
  };

  this.match = function (pattern, method) {
    var route = new BaseRoute(pattern, method)
    this.routes.push(route);
    return route;
  };

  // Iterate through your routes and return the controller/action
  // corresponding to the matched route
  this.first = function (req) {
    var params = url.parse(req.url, true);
    params.controller = null;
    params.action = null;
    return params;
  };
})();

BaseRoute = function (pattern, method) {
  this.pattern = pattern;
  this.method = method;
  this.handler = null;
};

BaseRoute.prototype = new (function () {
  // Handler should be in format {controller: 'Foo', action: 'bar'}
  // If no action is defined, 'handle' action is assumed
  this.to = function (handler) {
    this.handler = handler;
  };
})();

exports.BaseRouter = BaseRouter;
