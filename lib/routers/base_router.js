/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

// This is for documentation purposes only.
// If you are making a router, you should minimally
// provide this interface.
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
  // 'method' is passed separately because it may be an overridden
  // POST in crappier clients
  this.first = function (req, method) {
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
