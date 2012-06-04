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
  , querystring = require('../deps/qs')
  , path = require('path')
  , cwd = process.cwd()
  , errors = require('./response/errors')
  , response = require('./response')
  , model = require('./model')
  , utils = require('./utils/index')
  , fileUtils = require('./utils/file')
  , inflection = require('../deps/inflection')
  , i18n = require('./i18n')
  , init = require('./init')
  , FunctionRouter = require('./routers/function_router').FunctionRouter
  , RegExpRouter = require('./routers/regexp_router').RegExpRouter
  , BaseController = require('./base_controller').BaseController
  , sessions = require('./sessions')
  , CookieCollection = require('./cookies').CookieCollection
  , Request = require('./request').Request
  , InFlight = require('./in_flight').InFlight;

// Set up a bunch of aliases
geddy.FunctionRouter = FunctionRouter;
geddy.RegExpRouter = RegExpRouter;
geddy.inFlight = new InFlight();
geddy.inflection = inflection;
geddy.model = model;
geddy.model.adapter = {};
geddy.utils = utils;
geddy.errors = errors;

var App = function () {
  var JSPAT = /\.(js|coffee)$/;

  var _getDirList = function (dirname) {
        var dirList = fs.readdirSync(dirname)
          , fileName
          , filePath
          , ctorName
          , usingCoffee
          , ret = [];

        for (var i = 0; i < dirList.length; i++) {
          fileName = dirList[i];
          // Any files ending in '.js' or '.coffee'
          if (JSPAT.test(fileName)) {
            if(fileName.match(/\.coffee$/)) {
              // fileName is a CoffeeScript file so try to require it
              try {
                usingCoffee = usingCoffee || require('coffee-script');
              } catch(err) {
                new errors.coffeeError();
              }
            }
            // Strip the extension from the file name
            fileName = fileName.replace(JSPAT, '');

            // Convert underscores to camelCase with
            // initial cap, e.g., 'NeilPearts'
            ctorName = geddy.string.camelize(fileName, true);
            filePath = path.join(cwd, dirname, fileName);
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
        // Set any model properties set in the config
        geddy.mixin(geddy.model, geddy.config.model);

        var modelDir = 'app/models'
          , dirList
          , item
          , usingCoffee
          , adapterName
          , adapterPath
          , appAdaptersPath = path.join(cwd, modelDir, '/adapters/');
        // May be running entirely model-less
        if (!path.existsSync(path.join(cwd, modelDir))) {
          next();
        }
        else {
          dirList = _getDirList(modelDir)
          // Dynamically create controller
          // constructors from files in app/models
          for (var i = 0; i < dirList.length; i++) {
            item = dirList[i];
            require(item.filePath);
            // model exists now and has an adapter defined
            if (geddy.model[item.ctorName] && geddy.model[item.ctorName].adapter) {
              adapterName = geddy.model[item.ctorName].adapter;
              // Todo: There has to be a better way of detecting if it's coffee or not
              // - But I couldn't think of a reliable way that would work

              // If the app has an adapter that matches the model adapter, use it.
              if (path.existsSync(path.join(appAdaptersPath, adapterName.toLowerCase() + '.js')) ||
                  path.existsSync(path.join(appAdaptersPath, adapterName.toLowerCase() + '.coffee'))) {

                if(path.existsSync(path.join(appAdaptersPath, adapterName.toLowerCase() + '.coffee'))) {
                  try {
                    usingCoffee = usingCoffee || require('coffee-script');
                  } catch(err) {
                    new errors.coffeeError();
                  }
                }
                adapterPath = path.join(appAdaptersPath, adapterName.toLowerCase());
                geddy.model.adapter[item.ctorName] = require(adapterPath)[adapterName];
              }
              // if the model has been defined by geddy, use it.
              else if (path.existsSync(path.join(__dirname, "./model/adapters/", adapterName.toLowerCase() + '.js'))) {
                var config = {model: item.ctorName};
                adapterPath = path.join(__dirname, "./model/adapters/", adapterName.toLowerCase());
                geddy.model.adapter[item.ctorName] = require(adapterPath)[adapterName](config);
              }
              else {
                geddy.log.warning("no adapter found for " + adapterName);
              }
            }
            // if the model doesn't define an adapter, use the default
            else if (geddy.config.adapters && geddy.config.adapters.default &&
                    path.existsSync(path.join(__dirname, "./model/adapters/", geddy.config.adapters.default+".js"))) {
              geddy.model.adapter[item.ctorName] = require(path.join(__dirname, "./model/adapters/", geddy.config.adapters.default));
            }
            // the adapter will be undefined if the model doesn't define it,
            // and there is no default adapter in the config.
            else {
              geddy.log.warning("adapter not found, make sure your adapter is in app/models/adapters");
            }
          }
          next();
        }
      }

  // Load controller ctors
  // ==================
    , _registerConstructors = function (next) {
        var controllerDir = 'app/controllers'
          , dirList = _getDirList(controllerDir)
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
        routerCsFile = path.join(cwd, '/config/router.coffee');
        if(path.existsSync(routerCsFile)) {
          try {
            require('coffee-script');
          } catch(err) {
            new errors.coffeeError();
          }
        }
        router = require(path.join(cwd, '/config/router'));
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

  // Load any locales, set the default
  // ==================
    , _loadLocales = function (next) {
        init.init(next);
      }

  // Load metrics if they're turned on
  // ==================
    , _loadMetrics = function (next) {
        if (geddy.config.metrics) {
          geddy.metrics = require('./metric');
        }
        next();
      }

  // Register template-paths
  // ==================
    , _registerTemplatePaths = function (next) {
        var viewsPath = path.normalize('app/views');
        // May be running entirely viewless
        if (!path.existsSync(viewsPath)) {
          this.templateRegistry = {};
          next();
        }
        else {
          var templates = {}
            , files
            , file
            , noExtFile
            , fileExt
            , fileBaseName
            , pat = /\.(ejs|jade|coffee|hbs|mustache|ms)$/;
          files = fileUtils.readdirR(viewsPath);
          for (var i = 0; i < files.length; i++) {
            file = files[i];
            fileExt = path.extname(file);
            fileBaseName = path.basename(file, fileExt).replace(/\.html$/, '');

            if (pat.test(file)) {
              // Strip .html and extension for easier detecting when rendering
              noExtFile = file.replace(/\.html.*$/, '');
              templates[noExtFile] = {
                  registered: true
                , file: file
                , ext: fileExt
                , baseName: fileBaseName
                , baseNamePath: noExtFile
              };
            }
          }
          this.templateRegistry = templates;
          next();
        }
      }

  // Run code in the app's config/init.js or .coffee variation
  // ==================
    , _runAppLocalInit = function (next) {
        var dirList = fs.readdirSync(cwd + '/config')
          , fileName
          , fileExt
          , fileBaseName
          , usingCoffee;

        for(var i = 0; i < dirList.length; i++) {
          fileName = dirList[i];
          fileExt = path.extname(fileName);
          fileBaseName = path.basename(fileName, fileExt);

          if(fileBaseName === 'init') {
            if(fileExt === '.coffee') {
              // fileName is a CoffeeScript file so try to require it
              try {
                usingCoffee = usingCoffee || require('coffee-script');
              } catch(err) {
                new errors.coffeeError();
              }
            }
            require(path.join(cwd, 'config', fileName));
          }
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
    , _loadLocales
    , _loadMetrics
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
    var allRequestTimer = geddy.config.metrics && geddy.metrics.Timer('Geddy.all-requests')
      , controllerActionTimers = {};
    geddy.server.addListener('request', function (req, resp) {
      var reqObj
        , params
        , urlParams
        , method
        , ctor
        , appCtor
        , baseController
        , controller
        , controllerName
        , actionName
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

      // Buffered request-obj -- buffer the request data,
      // and pass this proxy object to the controller
      reqObj = new Request(req);

      finish = function (step) {
        steps[step] = true;
        for (var p in steps) {
          if (!steps[p]) {
            return false;
          }
        }
        controller._handleAction.call(controller, params.action);
        reqObj.sync(); // Flush buffered events and begin emitting
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
            , level = parseInt(stat, 10) > 499 ? 'error' : 'access'
            , endTime = new Date();
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
          if (geddy.config.metrics) {
            allRequestTimer.update(endTime - accessTime);
            controllerActionTimers[controllerName] = controllerActionTimers[controller] || {}
            controllerActionTimers[controllerName][actionName] =
                controllerActionTimers[controllerName][actionName] ||
                geddy.metrics.Timer("Geddy."+controllerName + '.' + actionName)
            controllerActionTimers[controllerName][actionName].update(endTime - accessTime);
          }
        });

        params = router.first(req, method);
      }

      if (params) {
        if (params instanceof Error) {
          err = new errors.MethodNotAllowedError(method + ' method is not allowed.');
          errResp = new response.Response(resp);
          errResp.send(err.message, err.statusCode, {
            'Content-Type': 'text/html'
          , 'Allow': params.allowed.join(', ')
          });
        }
        else {
          controllerName = params.controller;
          actionName = params.action;
          ctor = ctors[params.controller];
          if (ctor) {
            // Merge params from the URL and the query-string to produce a
            // Grand Unified Params object
            geddy.mixin(params, urlParams);

            // If it's a plain form-post, save the request-body, and parse it into
            // params as well
            if ((req.method == 'POST' || req.method == 'PUT') &&
                (req.headers['content-type'] &&
                  (req.headers['content-type'].indexOf('form-urlencoded') > -1 ||
                   req.headers['content-type'].indexOf('application/json') > -1))) {
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

            // If there's an Application controller, use an instance of it
            // as the prototype of the controller for this request
            if (ctors.Application) {
              // The constructor for the Application controller
              appCtor = ctors.Application;
              // Give the constructor a new prototype to inherit from: an instance
              // of the BaseController, with the methods/properties from its original
              // prototype copied over
              appCtor.prototype = utils.enhance(new BaseController(),
                  appCtor.origPrototype);
              // Make an instance -- this instance will be the proto for the
              // controller for this request
              baseController = new appCtor();
            }
            // If there's no Application controller, use an instance of
            // BaseController as the proto
            else {
              baseController = new BaseController();
            }

            // Give the constructor for this request's controller a new
            // prototype: the Application/BaseController (or just BaseController)
            // instance, with the methods/properties from the original prototype
            // copied over
            ctor.prototype = utils.enhance(baseController,
                ctor.origPrototype);
            // Instantiate the controller
            controller = new ctor();

            // Now that there's a controller, record the access-time
            controller.accessTime = accessTime;

            if (typeof controller[params.action] == 'function') {
              controller.app = self;
              controller.request = reqObj;
              controller.response = resp;
              controller.method = method;
              controller.params = params;
              controller.name = params.controller;
              controller.i18n = new i18n.I18n(controller);

              // We have a controller instance; register it with the
              // in-flight data
              geddy.inFlight.updateEntry(req._geddyId, {
                controller: controller
              });

              controller.cookies = new CookieCollection(req);

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
          // no controller, 500 error
          else {
            err = new errors.internalservererror('controller ' +
                params.controller + ' not found.');
            errresp = new response.response(resp);
            errresp.send(err.message, err.statuscode,
                {'content-type': 'text/html'});
          }
        }
      }
      // Either static or 404
      else {
        // Get the path to the file
        staticPath = geddy.config.staticFilePath + '/' + req.url;
        // Ignore querystring
        staticPath = staticPath.split('?')[0];
        // Decode path (e.g. %20)
        staticPath = decodeURIComponent(staticPath);

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

