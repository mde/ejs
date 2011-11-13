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

var geddy = {}
  , fs = require('fs')
  , url = require('url')
  , querystring = require('querystring')
  , path = require('path')
  , errors = require('./errors')
  , response = require('./response')
  , utils = require('./utils/index')
  , inflection = require('../deps/inflection')
  , Worker = require('./worker').Worker
  , FunctionRouter = require('./routers/function_router').FunctionRouter
  , RegExpRouter = require('./routers/regexp_router').RegExpRouter
  , BaseController = require('./base_controller').BaseController
  , sessions = require('./sessions')
  , CookieCollection = require('./cookies').CookieCollection
  , dir = process.cwd()
  , worker = new Worker()
  , vm = require('vm')
  , exec = require('child_process').exec;

geddy.mixin = utils.mixin
geddy.objectToString = utils.objectToString; // WTF
geddy.string = utils.string;
geddy.async = utils.async;
geddy.uri = utils.uri;
geddy.inflection = inflection;

geddy.mixin(geddy, new (function () {

  // Load app-config
  // ==================
  var _loadConfig = function (callback) {
        var config = worker.config
          , dirname = '/config'
          , filename = dirname + '/' + config.environment + '.js'
          , appConfig = vm.runInThisContext(fs.readFileSync(dir + filename).toString());
        this.config = geddy.mixin({}, config, appConfig, true);
        callback();
      }
  // Load controller ctors
  // ==================
    , _getControllerConstructors = function (callback) {
        var dirname = '/app/controllers'
          , dirList = fs.readdirSync(dir + dirname)
          , fileName
          , filePath
          , ctorName
          , ctors = {}
          , ctor
          , jsPat = /\.js$/;

        // Dynamically create controller constructors from files in constructors/
        for (var i = 0; i < dirList.length; i++) {
          fileName = dirList[i];
          // Any files ending in '.js' -- e.g., 'neil_pearts.js'
          if (jsPat.test(fileName)) {
            // Strip the '.js', e.g., 'neil_pearts'
            fileName = fileName.replace(jsPat, '');
            // Convert underscores to camelCase with initial cap, e.g., 'NeilPearts'
            ctorName = geddy.string.camelize(fileName, true);
            filePath = dir + dirname + '/' + fileName;
            // Registers as a constructor, e.g., ctors.NeilPearts =
            //    require('/path/to/geddy_app/<dirname>/neil_pearts').NeilPearts
            ctors[ctorName] = require(filePath)[ctorName];
          }
        }
        for (var p in ctors) {
          ctor = ctors[p];
          ctor.origPrototype = ctor.prototype;
        }
        this.controllerRegistry = ctors;
        callback();
      }

  // Load the router
  // ==================
    , _loadRouter = function (callback) {
        router = require(dir + '/config/router');
        router = router.router || router;
        this.router = router;
        callback();
      }

  // Connect to session-store
  // ==================
    , _loadSessionStore = function (callback) {
        sessionsConfig = this.config.sessions;
        if (sessionsConfig) {
          sessions.createStore(sessionsConfig.store, function () {
            callback();
          });
        }
        else {
          callback();
        }
      }

  // Register template-paths
  // ==================
    , _registerTemplatePaths = function (callback) {
        var self = this;
        exec('find ' + dir + '/app/views', function (err, stdout, stderr) {
          var templates
            , files
            , file
            , pat = /\.ejs$/;
          if (err) {
            console.log('Error: ' + JSON.stringify(err));
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
            callback();
          }
        });
      };

  this.config = null;
  this.server = null;
  this.worker = null;
  this.router = null;
  this.FunctionRouter = FunctionRouter;
  this.RegExpRouter = RegExpRouter;
  this.controllerRegistry = {};
  this.templateRegistry = {};

  this.init = function () {
    var self = this
      , items
      , chain;

    // Make some aliases
    // ==================
    self.worker = worker;
    self.server = worker.server;

    items = [
      _loadConfig
    , _getControllerConstructors
    , _loadRouter
    , _loadSessionStore
    , _registerTemplatePaths
    ];

    chain = new geddy.async.SimpleAsyncChain(items, this);
    chain.last = function () {
      self.start();
    };

    chain.run();
  };

  this.start = function () {
    var self = this
      , ctors = this.controllerRegistry
      , router = this.router;

    // Handle the requests
    // ==================
    this.server.addListener('request', function (req, resp) {
      var params
        , urlParams
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
        , finish;

      finish = function (step) {
        steps[step] = true;
        for (var p in steps) {
          if (!steps[p]) {
            return false;
          }
        }

        controller._handleAction.call(controller, params.action);
      };

      //TODO: get better logs (including http status codes)
      // by wrapping serverResponse.end()
      req.addListener('end', function () {
        self.log.access(req.connection.remoteAddress +
            " " + new Date() + " " + req.method + " " + req.url);
      });

      self.requestTime = (new Date()).getTime();

      if (router) {
        params = router.first(req);
      }
      if (params) {
        ctor = ctors[params.controller];
        if (ctor) {

          // Parses form input, and merges it with params from
          // the URL and the query-string to produce a Grand Unified Params object
          urlParams = url.parse(req.url, true).query
          geddy.mixin(params, urlParams);
          // If it's a plain form-post, parse the request-body into
          // params as well
          if ((req.method == 'POST' || req.method == 'PUT') &&
              (req.headers['content-type'].indexOf('form-urlencoded') > -1)) {
            req.addListener('data', function (data) {
              body += data.toString();
            });
            // Handle the request once it's finished
            req.addListener('end', function () {
              bodyParams = querystring.parse(body);
              geddy.mixin(params, bodyParams);
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
          ctor.prototype = utils.enhance(baseController, ctor.origPrototype);
          controller = new ctor();
          controller.request = req;
          controller.response = resp;
          controller.params = params;
          controller.name = params.controller;

          controller.cookies = new CookieCollection(req);

          if (self.config.sessions) {
            controller.session = new sessions.Session(controller, function () {
              finish('sessions');
            });
          }
          else {
            finish('sessions');
          }
        }
        // 500 error
        else {
          err = new errors.InternalServerError('Controller ' + params.controller +
              ' not found.');
          errResp = new response.Response(resp);
          errResp.send(err.message, err.statusCode, {'Content-Type': 'text/html'});
        }
      }
      // Either static or 404
      else {
        staticPath = self.config.staticFilePath + '/' + req.url;
        if (path.existsSync(staticPath)) {
          staticResp = new response.Response(resp);
          staticResp.sendFile(staticPath);
        }
        else {
          err = new errors.NotFoundError(req.url + ' not found.');
          errResp = new response.Response(resp);
          errResp.send(err.message, err.statusCode, {'Content-Type': 'text/html'});
        }
      }
    });

  };
  this.log = worker.log;
})());

global.geddy = geddy;

worker.start(function () {
  geddy.init();
});
