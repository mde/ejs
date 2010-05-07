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
var log = require('geddy-core/lib/log');

var Controller = require('./controller').Controller;

var App = function (initData) {
  var _this = this;

  this.run = function (req, resp) {

    // capture the request start time for reporting
    resp.startTime = new Date().getTime();

    // Build the request body
    // TODO: Wrap in some sort of abstraction
    req.body = '';
    req.addListener('data', function (data) {
      req.body += data;
    });

    // Handle the request once it's finished
    req.addListener('end', function () {
      var url = req.url;
      // Split only on question mark -- using semicolon delimiter for
      // edit-flag hack in resource-routes
      var base = url.split(/\?|=/)[0];
      var qs = url.split('?')[1] || '';
      var qsParams = fleegix.url.qsToObject(qs);
      var method = (req.method == 'POST' && qsParams._method) ?
          qsParams._method : req.method;
      var route = router.parse(base, method);
      
      log.debug(req.method + ': ' + url)

      try {
        // If the route is a match, run the matching controller/action
        if (route) {
          var cook = new cookies.CookieCollection(req);

          var sess = new session.Session({
            app: this,
            request: req,
            cookies: cook
          });
          
          log.debug('Routed to ' + route.controller + ' controller, ' + route.action + ' action');

          sess.init(function () {

            // Split only on question mark -- using semicolon delimiter for
            // edit-flag hack in resource-routes
            var params = mergeParams(req, route.params, qsParams);
            log.debug('params: ' + JSON.stringify(params))

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

            controller = util.meta.mixin(controller, mixin);
            controller.handleAction(route.action, params);
          });

        }
        else {
          var path = config.staticFilePath + req.url;
          fs.stat(path, function (err, stats) {
            // File not found, hand back the 404
            if (err) {
              var e = new errors.NotFoundError('Page ' + req.url + ' not found.');
              var r = new response.Response(resp);
              r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
              log.warn('ERROR: ' + req.url + ' not found.').flush();
            }
            else {
              var r = new response.Response(resp);
              r.sendFile(path);
              log.debug('FILE: sent static file ' + path).flush();
            }
          });
        }
      }
      // Catch all errors, respond with error page & HTTP error code
      // Sadly, this doesn't catch errors in callbacks
      catch (e) {
        errors.respond(resp, e);
        log.warn('OOPS: ' + req.url + ' not found.').flush();
      }
    });

  };

};

var mergeParams = function (req, routeParams, qsParams) {
  var p = {};
  p = util.meta.mixin(p, routeParams);
  p = util.meta.mixin(p, qsParams);
  if ((req.method == 'POST' || req.method == 'PUT') &&
      (req.headers['content-type'].indexOf('form-urlencoded') > -1)) {
    // Deal with the retarded default encoding of spaces to plus-sign
    var b = req.body.replace(/\+/g, '%20');
    var bodyParams = fleegix.url.qsToObject(b, {arrayizeMulti: true});
    p = util.meta.mixin(p, bodyParams);
  }
  return p;
};

exports.App = App;
