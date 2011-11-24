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
var url = require('url')
  , BaseRouter = require('./base_router').BaseRouter;

var FunctionRouter = function (routes) {
  this.routes = [];
  if (routes) {
    this.setRoutes(routes);
  }
};

FunctionRouter.prototype = new BaseRouter();

FunctionRouter.prototype.first = function (req, method) {
  var routes = this.routes
    , route
    , handler
    , params = url.parse(req.url, true).query;
  for (var i = 0, ii = routes.length; i < ii; i++) {
    route = routes[i];
    if (route.pattern(req, params)) {
      handler = route.handler;
      params.controller = handler.controller;
      params.action = handler.action;
      return params;
    }
  }
  return null;
};

exports.FunctionRouter = FunctionRouter;
