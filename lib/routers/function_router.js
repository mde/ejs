var url = require('url')
  , BaseRouter = require('./base_router').BaseRouter;

var FunctionRouter = function (routes) {
  this.routes = [];
  if (routes) {
    this.setRoutes(routes);
  }
};

FunctionRouter.prototype = new BaseRouter();

FunctionRouter.prototype.first = function (req) {
  var routes = this.routes
    , route
    , handler
    , params;
  for (var i = 0, ii = routes.length; i < ii; i++) {
    route = routes[i];
    if (route.pattern(req)) {
      handler = route.handler;
      params = url.parse(req.url, true);
      params.controller = handler.controller;
      params.action = handler.action;
      return params;
    }
  }
  return null;
};

exports.FunctionRouter = FunctionRouter;
