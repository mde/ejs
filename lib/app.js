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

var fs = require('fs')
  , url = require('url')
  , querystring = require('querystring')
  , exec = require('child_process').exec
  , path = require('path')
  , dir = process.cwd()
  , errors = require('./errors')
  , response = require('./response')
  , model = require('./model')
  , utils = require('./utils/index')
  , inflection = require('../deps/inflection')
  , FunctionRouter = require('./routers/function_router').FunctionRouter
  , RegExpRouter = require('./routers/regexp_router').RegExpRouter
  , BaseController = require('./base_controller').BaseController
  , sessions = require('./sessions')
  , CookieCollection = require('./cookies').CookieCollection
  , EventEmitter = require('events').EventEmitter
  , EventBuffer = require('./utils/event_buffer').EventBuffer
  , InFlight = require('./in_flight').InFlight;

// Set up a bunch of aliases
geddy.FunctionRouter = FunctionRouter;
geddy.RegExpRouter = RegExpRouter;
geddy.inFlight = new InFlight();
geddy.inflection = inflection;
geddy.model = model;
geddy.utils = utils;

var App = function () {
  var JSPAT = /\.js$/;

  var _getDirList = function (dirname) {
        var dirList = fs.readdirSync(dir + dirname)
          , fileName
          , filePath
          , ctorName
          , ret = [];

        for (var i = 0; i < dirList.length; i++) {
          fileName = dirList[i];
          // Any files ending in '.js' -- e.g., 'neil_pearts.js'
          if (JSPAT.test(fileName)) {
            // Strip the '.js', e.g., 'neil_pearts'
            fileName = fileName.replace(JSPAT, '');
            // Convert underscores to camelCase with
            // initial cap, e.g., 'NeilPearts'
            ctorName = geddy.string.camelize(fileName, true);
            filePath = dir + dirname + '/' + fileName;
            ret.push({
              ctorName: ctorName
            , filePath: filePath
            });
          }
        }
        return ret;
      }

  // Load models
  // ==================
    , _registerModels = function (next) {
        var dirname = '/app/models'
          , dirList
          , item;
        // May be running entirely model-less
        if (!path.existsSync(dir + dirname)) {
          next();
        }
        else {
          dirList = _getDirList(dirname)
          // Dynamically create controller
          // constructors from files in app/models
          for (var i = 0; i < dirList.length; i++) {
            item = dirList[i];
            require(item.filePath);
          }
          next();
        }
      }

  // Load controller ctors
  // ==================
    , _registerConstructors = function (next) {
        var dirname = '/app/controllers'
          , dirList = _getDirList(dirname)
          , item
          , ctors = {}
          , ctor;

        // Dynamically create controller constructors
        // from files in app/constructors
        for (var i = 0; i < dirList.length; i++) {
          item = dirList[i];
          ctor = require(item.filePath)[item.ctorName];
          ctor.origPrototype = ctor.prototype;
          this.controllerRegistry[item.ctorName] = ctor;
        }
        next();
      }

  // Load the router
  // ==================
    , _loadRouter = function (next) {
        router = require(dir + '/config/router');
        router = router.router || router;
        this.router = router;
        next();
      }

  // Connect to session-store
  // ==================
    , _loadSessionStore = function (next) {
        sessionsConfig = geddy.config.sessions;
        if (sessionsConfig) {
          sessions.createStore(sessionsConfig.store, next);
        }
        else {
          next();
        }
      }

  // Register template-paths
  // ==================
    , _registerTemplatePaths = function (next) {
        var self = this
          , viewsPath = dir + '/app/views';
        // May be running entirely viewless
        if (!path.existsSync(viewsPath)) {
          self.templateRegistry = {};
          next();
        }
        else {
          exec('find ' + viewsPath, function (err, stdout, stderr) {
            var templates
              , files
              , file
              , pat = /\.ejs$/;
            if (err) {
              throw err;
            }
            else if (stderr) {
              console.log('Error: ' + stderr);
            }
            else {
              templates = {};
              files = stdout.split('\n');
              for (var i = 0; i < files.length; i++) {
                file = files[i];
                if (pat.test(file)) {
                  file = file.replace(dir + '/', '');
                  templates[file] = true;
                }
              }
              self.templateRegistry = templates;
              next();
            }
          });
        }
      }

  // Run code in the app's config/init.js
  // ==================
    , _runAppLocalInit = function (next) {
        if (path.existsSync(dir + '/config/init.js')) {
          require(dir + '/config/init');
        }
        next();
      };


  this.router = null;
  this.modelRegistry = {};
  this.templateRegistry = {};
  this.controllerRegistry = {};

  this.init = function (callback) {
    var self = this
      , items
      , chain;

    items = [
      _registerModels
    , _registerConstructors
    , _loadRouter
    , _loadSessionStore
    , _registerTemplatePaths
    , _runAppLocalInit
    ];

    chain = new geddy.async.SimpleAsyncChain(items, this);
    chain.last = function () {
      self.start(callback);
    };

    chain.run();
  };

  this.start = function (callback) {
    var self = this
      , ctors = this.controllerRegistry
      , router = this.router;

    // Handle the requests
    // ==================
    geddy.server.addListener('request', function (req, resp) {
      var reqBuffer
        , reqObj
        , reqProperties = ['method', 'url', 'headers', 'trailers', 'httpVersion', 'connection']
        , params
        , urlParams
        , method
        , ctor
        , appCtor
        , baseController
        , controller
        , staticPath
        , staticResp
        , err
        , errResp
        , body = ''
        , bodyParams
        , steps = {
            parseBody: false
          , sessions: false
          }
        , finish
        , accessTime = (new Date()).getTime()
        , inFlighId;

      // Buffer the request data, we'll pass this proxy object to the controller
      reqBuffer = new EventBuffer(req);
      reqObj = new EventEmitter();
      for(var i in reqProperties) {
        reqObj[reqProperties[i]] = req[reqProperties[i]];
      }

      finish = function (step) {
        steps[step] = true;
        for (var p in steps) {
          if (!steps[p]) {
            return false;
          }
        }

        controller._handleAction.call(controller, params.action);
        reqBuffer.flush(reqObj);
      };

      if (router) {
        urlParams = url.parse(req.url, true).query;

        if (req.method.toUpperCase() == 'POST') {
          // POSTs may be overridden by the _method param
          if (urlParams._method) {
              method = urlParams._method;
          }
          // Or x-http-method-override header
          else if (req.headers['x-http-method-override']) {
            method = req.headers['x-http-method-override'];
          }
          else {
            method = req.method;
          }
        }
        else {
          method = req.method;
        }
        // Okay, let's be anal and force all the HTTP verbs to uppercase
        method = method.toUpperCase();

        inFlightId = geddy.inFlight.addEntry({
          request: req
        , method: method
        , response: resp
        , accessTime: accessTime
        });
        req._geddyId = inFlightId;
        resp._geddyId = inFlightId;

        // FIXME: Holy shit, all inline here
        resp.addListener('finish', function () {
          var id = resp._geddyId
            , entry = geddy.inFlight.getEntry(id)
            , req = entry.request
            , stat = resp.statusCode
            , level = parseInt(stat, 10) > 499 ? 'error' : 'access';
          // Apache extended log-format
          geddy.log[level](req.connection.remoteAddress + ' ' +
              '- ' +
              '- ' +
              '[' + new Date(entry.accessTime) + '] ' +
              '"' + entry.method + ' ' + req.url + ' ' +
                  req.httpVersion + '" ' +
              stat + ' ' +
              (resp._length || '-') + ' ' +
              '"' + (req.headers['referer'] || '-') + '" ' +
              '"' + (req.headers['user-agent'] || '-') + '" ');
          geddy.inFlight.removeEntry(id);
        });

        params = router.first(req, method);
      }

      if (params) {
        ctor = ctors[params.controller];
        if (ctor) {
          // Merge params from the URL and the query-string to produce a
          // Grand Unified Params object
          geddy.mixin(params, urlParams);

          // If it's a plain form-post, save the request-body, and parse it into
          // params as well
          if ((req.method == 'POST' || req.method == 'PUT') &&
              (req.headers['content-type'].indexOf('form-urlencoded') > -1 ||
              req.headers['content-type'].indexOf('application/json') > -1)) {
            req.addListener('data', function (data) {
              body += data.toString();
            });
            // Handle the request once it's finished
            req.addListener('end', function () {
              bodyParams = querystring.parse(body);
              geddy.mixin(params, bodyParams);
              req.body = body;
              finish('parseBody');
            });
          }
          else {
            finish('parseBody');
          }

          if (ctors.Application) {
            appCtor = ctors.Application;
            appCtor.prototype = utils.enhance(new BaseController(),
                appCtor.origPrototype);
            baseController = new appCtor();
          }
          else {
            baseController = new BaseController();
          }
          ctor.prototype = utils.enhance(baseController,
              ctor.origPrototype);
          controller = new ctor();

          // As soon as we have a controller, record the access-time
          controller.accessTime = accessTime;

          if (typeof controller[params.action] == 'function') {
            controller.request = reqObj;
            controller.response = resp;
            controller.method = method;
            controller.params = params;
            controller.name = params.controller;

            // We have a controller instance; register it with the
            // in-flight data
            geddy.inFlight.updateEntry(req._geddyId, {
              controller: controller
            });

            controller.cookies = new CookieCollection(req);

            if (method == 'POST') {
              geddy.log.debug(method + ' ' + req.url);
              req.addListener('data', function (data) {
                geddy.log.debug('received data');
              });
            }

            if (geddy.config.sessions) {
              controller.session =
                  new sessions.Session(controller, function () {
                finish('sessions');
              });
            }
            else {
              finish('sessions');
            }
          }
          // No action, 500 error
          else {
            err = new errors.InternalServerError('No ' + params.action +
                ' action on ' + params.controller + ' controller.');
            errResp = new response.Response(resp);
            errResp.send(err.message, err.statusCode,
                {'Content-Type': 'text/html'});
          }
        }
        // No controller, 500 error
        else {
          err = new errors.InternalServerError('Controller ' +
              params.controller + ' not found.');
          errResp = new response.Response(resp);
          errResp.send(err.message, err.statusCode,
              {'Content-Type': 'text/html'});
        }
      }
      // Either static or 404
      else {
        staticPath = geddy.config.staticFilePath + '/' + req.url;
        // Ignore querystring, just serve the file
        staticPath = staticPath.split('?')[0];

        if (path.existsSync(staticPath)) {
          staticResp = new response.Response(resp);
          staticResp.sendFile(staticPath);
        }
        else {
          err = new errors.NotFoundError(req.url + ' not found.');
          errResp = new response.Response(resp);
          errResp.send(err.message, err.statusCode,
              {'Content-Type': 'text/html'});
        }
      }
    });

    callback();
  };

};

module.exports.App = App;

