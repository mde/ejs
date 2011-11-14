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
var util = require('util');
var fs = require('fs');

var errors = require('geddy-core/lib/errors');
var session = require('geddy-core/lib/session');
var response = require('geddy-core/lib/response');
var cookies = require('geddy-core/lib/cookies');
var log = require('geddy-core/lib/log');

var Controller = require('./controller').Controller;

var App = function (initData) {
  var _this = this;
  _queue = [];
  _processing = false;

  /**
   * Initial handler for request/response pairs -- adds two event listners:
   * 1. data listener, accumulates the request body
   * 2. end listener, queues the request for processing
   * 
   */
  this.handleReq = function (req, resp) {
    // TODO: Wrap the request to avoid ad-hoc addition of body prop
    // on actual request
    req.body = '';
    req.addListener('data', function (data) {
      req.body += data;
    });
    // Handle the request once it's finished
    req.addListener('end', function () {
      _this.queueReq(req, resp);
    });
  };

  /**
   * Queues request/response pairs for processing, triggers processing
   * if there are no outstanding requests still being processed
   */
  this.queueReq = function (req, resp) {
    _queue.push([req, resp]);
    if (!_processing) {
      this.processReq();
    }
  };

  /**
   * Pulls a request off the queue, processes it with the run function
   * 
   */
  this.processReq = function () {
    _processing = true;
    var next = _queue.shift();
    // If we still have request/response pairs to process, keep running
    // them through
    if (next) {
      process.nextTick(function () {
        _this.run.apply(_this, next);
      });
    }
    // If we're done with all outstanding request/response pairs, flip off 
    //the flag hat tells the queueReq method is can process any new incoming
    // requests
    else {
      _processing = false;
    }
  };

  /**
   * Called after responses end, either successfully, or with an error
   * Grabs the next request/response pair to process
   */
  this.nextReq = function () {
    _processing = false;
    this.processReq();
  };

  this.run = function (req, resp) {
    
    // Set the 'currently processing req/resp vars to this pair -- these may
    // be used in the case of unhandled errors to hand the user back a 500
    geddy.request = req;
    geddy.response = resp;
    
    try {
      // capture the request start time for reporting
      resp.startTime = new Date().getTime();

      var url, base, qs, qsParams, method, params, cook, sess,
          constructor, controller, mixin, path, e, r
      
      // Let's start with the URL
      url = req.url;

      // Get the QS params, so we can check to see if there's a method override
      qs = geddy.util.url.getQS(url);
      qsParams = geddy.util.url.qsToObject(qs);
      
      // The method may be overridden by the _method param
      // TODO: Look for the x-http-method-override header
      method = (req.method.toUpperCase() == 'POST' && qsParams._method) ?
          qsParams._method : req.method;
      // Okay, let's be anal and force all the HTTP verbs to uppercase
      method = method.toUpperCase();
      
      // The base path -- the router doesn't need to know about QS params
      base = geddy.util.url.getBase(url);

      // =====
      // All the routing magic happens right here
      // =====
      params = geddy.router.first(base, method);      
      log.debug(method + ': ' + url);

      // The route matches -- we have a winner!
      if (params) {
        log.debug('Routed to ' + params.controller + ' controller, ' + params.action + ' action, ' + params.format + ' format');

        // Set up the cookies for this request so we can do the session thing
        cook = new cookies.CookieCollection(req);
        // Empty session object, ready to be initialized
        sess = new session.Session({
          app: this,
          request: req,
          cookies: cook
        });
        // Session init may involve async I/O (e.g., DB access, etc.)
        // so the actual action invocation and response happens
        // in the callback from session.init
        sess.init(function () {

          // Construct the full set of params from:
          // 1. Any request body 2. URL params 3. query-string params
          params = mergeParams(req, params, qsParams);
          log.debug('params: ' + JSON.stringify(params))

          // Instantiate the matching controller from the registry
          constructor = geddy.controllerRegistry[params.controller];
          // Give it all the base Controller fu
          constructor.prototype = new Controller({
            request: req,
            response: resp,
            name: params.controller,
            params: params,
            cookies: cook,
            session: sess
          });
          controller = new constructor();

          // Mix in any user-defined Application methods
          mixin = new geddy.controllerRegistry.Application();
          controller = geddy.util.meta.mixin(controller, mixin);
          
          // All righty, let's handle the action
          controller.handleAction(params.action, params);
        });

      }
      
      // Either static or 404 
      else {
        path = geddy.config.staticFilePath + base;
        fs.stat(path, function (err, stats) {
          // File not found, hand back the 404
          if (err) {
            e = new errors.NotFoundError('Page ' + req.url + ' not found.');
            r = new response.Response(resp);
            r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
            log.warn('ERROR: ' + req.url + ' not found.').flush();
          }
          // Otherwise it's a static file to serve
          else {
            r = new response.Response(resp);
            r.sendFile(path);
          }
        });
      }



    }
    catch (e) {
      errors.respond(resp, e);
    }

  };


};

// I'm sure there's a better place for this
// This parses form input, and merges it with params from
// the URL and the query-string to produce a Grand Unified Params object
var mergeParams = function (req, routeParams, qsParams) {
  var p = {};
  p = geddy.util.meta.mixin(p, routeParams);
  p = geddy.util.meta.mixin(p, qsParams);
  if ((req.method == 'POST' || req.method == 'PUT') &&
      (req.headers['content-type'].indexOf('form-urlencoded') > -1)) {
    // Deal with the retarded default encoding of spaces to plus-sign
    var b = req.body.replace(/\+/g, '%20');
    var bodyParams = geddy.util.url.qsToObject(b, {arrayizeMulti: true});
    p = geddy.util.meta.mixin(p, bodyParams);
  }
  return p;
};

exports.App = App;
