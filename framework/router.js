
var Router = function () {
  // From BomberJS: http://bomber.obtdev.com/
  const KEY_PATTERN = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const MATCH_PATTERN_STRING = "([^\\\/.]+)";
  var _routes = [];
  var _namedRoutes = {};

  this.regExpEscape = function(str) {
    return str.replace(/(\/|\.)/g, "\\$1");
  };
  
  this.match = function(p) {
    var keys = [];
    var pat;
    var route;
    
    var path = '^' + p;
    if (path.lastIndexOf('/') != (path.length-1)) {
      path += '/?';
    }
    path = path + '$';
    path = this.regExpEscape(path);
    // full is ':foo' and submatch is 'foo'
    path = path.replace(KEY_PATTERN, function(full, submatch) {
        keys.push(submatch);
        return MATCH_PATTERN_STRING;
      });
    
    pat = new RegExp(path);
    route = new Route(pat, keys);
    _routes.push(route);
    return route;
  };
  
  this.find = function(path) {
    var count = _routes.length;
    for (var i = 0; i < count; i++) {
      var route = _routes[i];
      var match = path.match(route.regex);
      if (match) {
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

var Route = function (regex, keys, params, controller, action, name) {
  var _name;
  this.regex =  regex || null;
  this.keys = keys || null;
  this.params = params || {};
  this.controller = controller || null;
  this.action = action || null;
  if (name) {
    this.name(name);
  }
};

Route.prototype.to = function (obj) {
  this.controller = obj.controller;
  this.action = obj.action;
  return this;
};

Route.prototype.name = function (n) {
  _name = n;
  router.name(n, this);
  return this;
}

exports.Router = Router;


