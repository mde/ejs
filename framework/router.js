var fleegix = require('./fleegix');
var sys = require('sys');

/*
 * Simple router for Node -- setting up routes looks like this:
 *
 * r = new Router();
 * r.match('/').to({controller: 'Main', action: 'index'}).name('main');
 * r.match('/users/:userid/messages/:messageid').to({controller: 'Users', action: 'index'});
 *
 * Pretty familiar to anyone who's used Merb/Rails
 */

var Router = function () {
  // From BomberJS: http://bomber.obtdev.com/
  const KEY_PATTERN = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const MATCH_PATTERN_STRING = "([^\\\/.]+)";
  var _routes = [];
  var _namedRoutes = {};
  var _regExpEscape = function(str) {
    return str.replace(/(\/|\.)/g, "\\$1");
  };
  // For creating resource-based routes
  var _resourceTypes = [
    {method: 'get', path: null, action: 'index'},
    {method: 'get', path: '/add', action: 'add'},
    {method: 'post', path: null, action: 'create'},
    {method: 'get', path: '/:id', action: 'show'},
    {method: 'put', path: '/:id', action: 'update'},
    {method: 'delete', path: '/:id', action: 'remove'},
  ];

  this.match = function(pathDescription, method) {
    var keys = [];
    var pat;
    var route;

    var path = '^' + pathDescription + '$';
    path = _regExpEscape(path);
    // full match is ':foo' and submatch is 'foo'
    path = path.replace(KEY_PATTERN, function(full, submatch) {
        keys.push(submatch);
        return MATCH_PATTERN_STRING;
      });

    pat = new RegExp(path);
    route = new Route(pat, keys);
    if (method) {
      route.method = method;
    }
    _routes.push(route);
    return route; // Return route to allow chainable of 'to' and 'name'
  };

  this.resource = function (resource) {
    var controllerName;
    // Convert underscores to camelCase, e.g., 'neilPearts'
    controllerName = fleegix.string.camelize(resource);
    // Capitalize the first letter, e.g., 'NeilPearts'
    controllerName = fleegix.string.capitalize(controllerName);
    // Add a resource-based route for each type
    var r;
    for (var i = 0; i < _resourceTypes.length; i++) {
      var r = _resourceTypes[i];
      this.match('/' + resource + (r.path || ''), r.method).to(
          { controller: controllerName, action: r.action});
    }
  };

  this.parse = function(path, method) {
    var count = _routes.length;
    var meth = method.toLowerCase();
    for (var i = 0; i < count; i++) {
      var route = _routes[i];
      var match = path.match(route.regex);
      if (match && (!route.method || (route.method == meth))) {
        match.shift(); // First entry is the entire matched string
        for(var j = 0; j < route.keys.length; j++) {
          var key = route.keys[j];
          route.params[key] = match[j];
        }
        return route;
      }
    }
    return null;
  };

  this.name = function (n, r) {
    _namedRoutes[n] = r;
  }

};

var Route = function (regex, keys, params, method, controller, action, name) {
  var _name;
  this.regex =  regex || null;
  this.keys = keys || null;
  this.params = params || {};
  this.method = null;
  this.controller = controller || null;
  this.action = action || null;
  if (name) {
    this.name(name);
  }
};

Route.prototype.to = function (obj) {
  this.controller = obj.controller;
  this.action = obj.action;
  return this; // Chainable
};

Route.prototype.name = function (n) {
  _name = n;
  router.name(n, this);
  return this; // Chainable
}

exports.Router = Router;


