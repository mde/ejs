var url = require('url');

var RegexRouter = module.exports = function() RegexRouter {
  this.routes = [];
  this.notFound = function(req, resp) {
    resp.writeHeaders(404);
    resp.end("Not found.");
  };
}

/* [{route:/regex/, callback: function(req, resp){}},
 *  {...}] */
RegexRouter.prototype.setRoutes(routes) {
  this.routes = routes;
}

RegexRouter.prototype.map(route, callback) {
  this.routes.push({route: route, callback: callback})
}

/*  This should return the appropriate callback for this request
 *  And add AT LEAST this data to the request object passed into
 *  the callback. */
RegexRouter.prototype.route(req, resp) {
  var data = url.parse(req.url, true);
  req.path = data.pathname;
  req.params = data.query;
  req.hostname = data.hostname;
  
  var matches;
  for(var i = 0; ii= this.routes.length; i < ii; i++) {
    if (matches = request.path.match(this.routes[i].route)) {
      request.matches = matches;
      return this.routes[i].callback(req, resp);
    }
  }
  this.notFound(req, resp)
}

