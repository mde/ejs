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

var http = require('http');
var sys = require('sys');
var fs = require('fs');

var fleegix = require('geddy-core/lib/fleegix');
var errors = require('geddy-core/lib/errors');
var session = require('geddy-core/lib/session');
var response = require('geddy-core/lib/response');
var cookies = require('geddy-core/lib/cookies');

var Controller = require('./controller').Controller;

var App = function (initData) {
  var _this = this;

  this.run = function (req, resp) {
    var url = req.url;
    var base = fleegix.url.getBase(url);
    var route = router.parse(base, req.method);

    try {
      // If the route is a match, run the matching controller/action
      if (route) {
        var cook = new cookies.CookieCollection(req);

        var sess = new session.Session({
          app: this,
          request: req,
          cookies: cook
        });

        sess.init(function () {

          var qs = fleegix.url.getQS(url);
          var qsParams = fleegix.url.qsToObject(qs);
          var params = fleegix.mixin(route.params, qsParams);

          // Instantiate the matching controller from the registry
          var constructor = controllerRegistry[route.controller];
          // Give it all the base Controller fu
          constructor.prototype = new Controller({
            request: req,
            response: resp,
            name: route.controller,
            params: params,
            cookies: cook,
            session: sess
          });
          var controller = new constructor();

          // Mix in any user-defined Application methods
          var mixin = new controllerRegistry.Application();
          
          controller = fleegix.mixin(controller, mixin);

          controller.handleAction(route.action, params);
        });

      }
      else {
        // In dev mode, also serve static files
        if (config.environment = 'development') {
          var path = config.staticFilePath + req.url;
          fs.stat(path, function (err, stats) {
            // File not found, hand back the 404
            if (err) {
              var e = new errors.NotFoundError('Page ' + req.url + ' not found.');
              var r = new response.Response(resp);
              r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
            }
            else {
              var r = new response.Response(resp);
              r.sendFile(path);
            }
          });
        }
        // Otherwise shoot back the 404
        else {
          throw new errors.NotFoundError('Page ' + req.url + ' not found.');
        }
      }
     }
     // Catch all errors, respond with error page & HTTP error code
     catch (e) {
      throw e;
      //var r = new response.Response(resp);
      //r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
     }
  }
};

exports.App = App;
