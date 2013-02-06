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
  , path = require('path')
  , url = require('url')
  , model = require('model')
  , utils = require('./utils')
  , querystring = require('../deps/qs')
  , cwd = process.cwd()
  , errors = require('./response/errors')
  , response = require('./response')
  , init = require('./init')
  , helpers = require('./template/helpers')
  , actionHelpers = require('./template/helpers/action')
  , BaseController = require('./controller/base_controller').BaseController
  , ErrorController = require('./controller/error_controller').ErrorController
  , StaticFileController =
        require('./controller/static_file_controller').StaticFileController
  , sessions = require('./sessions')
  , CookieCollection = require('./cookies').CookieCollection
  , Request = require('./request').Request
  , Response = response.Response
  , InFlight = require('./in_flight').InFlight
  , i18n = utils.i18n
  , usingCoffee; // Global variable for CoffeeScript

// Set up a bunch of aliases
geddy.inFlight = new InFlight();
geddy.inflection = utils.inflection;
geddy.model = model;
geddy.utils = utils;
geddy.errors = errors;
geddy.viewHelpers = {};

// Use Geddy logger as the utility logger
utils.log.registerLogger(geddy.log);

var App = function () {
  var JSPAT = /\.(js|coffee)$/;

  var _getDirList = function (dirname) {
        var dirList = fs.readdirSync(dirname)
          , fileName
          , filePath
          , ctorName
          , ret = [];

        for (var i = 0; i < dirList.length; i++) {
          fileName = dirList[i];
          // Any files ending in '.js' or '.coffee'
          if (JSPAT.test(fileName)) {
            if (fileName.match(/\.coffee$/)) {
              // fileName is a CoffeeScript file so try to require it
              usingCoffee = usingCoffee || utils.file.requireLocal('coffee-script');
            }
            // Strip the extension from the file name
            fileName = fileName.replace(JSPAT, '');

            // Convert underscores to camelCase with
            // initial cap, e.g., 'NeilPearts'
            ctorName = geddy.string.camelize(fileName, {initialCap: true});
            filePath = path.join(cwd, dirname, fileName);
            ret.push({
                ctorName: ctorName
              , filePath: filePath
            });
          }
        }
        return ret;
      }

  // Locales and models
  // ==================
    , _baseInit = function (next) {
        init.init(this, next);
      }

  // Load controller ctors
  // ==================
    , _registerControllers = function (next) {
        var controllerDir = 'app/controllers'
          , dirList = _getDirList(controllerDir)
          , item
          , ctor
          , ctorActions;

        // Dynamically create controller constructors
        // from files in app/controllers
        for (var i = 0; i < dirList.length; i++) {
          item = dirList[i];
          ctor = require(item.filePath)[item.ctorName];
          ctor.origPrototype = ctor.prototype;
          this.controllerRegistry[item.ctorName] = ctor;
        }

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
        var viewsPath = path.normalize('app/views')
          , geddyTemplatesPath = path.join(__dirname, 'template', 'templates');

        // If viewsPath doesn't exist they're running viewless
        if(!utils.file.existsSync(viewsPath)) {
          this.templateRegistry = {};
          next();
        } else {
          var files = utils.file.readdirR(viewsPath)
            , geddyTemplatesFiles = utils.file.readdirR(geddyTemplatesPath)
            , pat = /\.(ejs|jade|hbs|mustache|ms|mu|swig)$/
            , templates = {}
            , file
            , origFile
            , noExtFile
            , fileExt
            , fileBaseName
            , addTemplate
            , createTemplates;

          // Adds a template object to templates
          addTemplate = function (noExtFile, file, origFile, fileExt, fileBaseName) {
            if(!origFile) origFile = noExtFile;

            templates[origFile] = {
                registered: true
              , file: file
              , ext: fileExt
              , baseName: fileBaseName
              , baseNamePath: noExtFile
            };
          };

          // Read dir list and create template objects from each file
          createTemplates = function (dir, isGeddy) {
            for (var i = 0; i < dir.length; i++) {
              file = dir[i];
              fileExt = path.extname(file);
              fileBaseName = path.basename(file, fileExt).replace(/\.html$/, '');

              if (isGeddy) {
                origFile = 'geddy/' + fileBaseName;
              }

              if (pat.test(file)) {
                // Strip .html and extension for easier detecting when rendering
                if (isGeddy) {
                  noExtFile = 'geddy/' + fileBaseName;
                } else noExtFile = file.replace(/\.html.*$/, '');

                addTemplate(noExtFile, file, origFile, fileExt, fileBaseName);
              }
            }
          };

          // Loop through template files and add it them to registry
          createTemplates(files);

          // Add custom templates from `lib/template/templates`
          createTemplates(geddyTemplatesFiles, true);

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
          , i = dirList.length;

        while (--i >= 0) {
          fileName = dirList[i];
          fileExt = path.extname(fileName);
          fileBaseName = path.basename(fileName, fileExt);

          if (fileBaseName === 'init') {
            if (fileExt === '.coffee') {
              // fileName is a CoffeeScript file so try to require it
              usingCoffee = usingCoffee || utils.file.requireLocal('coffee-script');
            }
            require(path.join(cwd, 'config', fileName));
          }
        }
        next();
      }

  // Run code in the app's config/after_start.js file
  // and run anything else that needs to be run after
  // the server has started listening for requests
  // ================================================
    , _afterStart = function (next) {
        geddy.server.listeners('request');

        // Load socket.io if it's enabled. This gets run after
        // the server starts listening for requests. Socket.io
        // won't work if we start it before.
        if (geddy.config.realtime) {
          geddy.io = utils.file.requireLocal('socket.io').listen(geddy.server, {'log level': 0});
          // add event listeners to all the models
          // set up socket.io emitters for each event

          var events = [
          , 'save'
          , 'update'
          , 'beforeRemove'
          ]

          , registerEventListener = function (model, event) {
            geddy.model[model].on(event, function (data) {
              var id;

              event = event.replace('before','').toLowerCase();

              if (typeof data == 'object') {
                data.model = model;
                data.event = event;
                id = data.id;
              }
              else {
                id = data;
              }

              geddy.io.sockets.emit(model+':'+event, data);
              geddy.io.sockets.emit(model+':'+event+':'+id, data);
            });
          }

          for (var i in geddy.model.descriptionRegistry) {
            for (var e in events) {
              registerEventListener(i, events[e]);
            }
          }

        }

        try {
          require(path.join(cwd, 'config', 'after_start'));
        } catch (e) {}
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
      _baseInit
    // TODO: Migrate all these into _baseInit
    , _registerControllers
    , _loadSessionStore
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
      , router = this.router
      , allRequestTimer = geddy.config.metrics && geddy.metrics.Timer('Geddy.all-requests')
      , controllerActionTimers = {};

    // Handle the requests
    // ==================
    geddy.server.addListener('request', function (req, resp) {
      var reqUrl
        , reqObj
        , respObj
        , params
        , urlParams
        , method
        , ctor
        , appCtor
        , baseController
        , controller
        , controllerName
        , actionName
        , staticUrl
        , publicPath
        , partialsPath
        , staticResp
        , nonMethodRoutes
        , acceptableMethods
        , err
        , errResp
        , contentType
        , body = ''
        , bodyParams
        , steps = {
            parseBody: false
          , sessions: false
          }
        , finish
        , accessTime = (new Date()).getTime()
        , inFlighId
        , sendStaticFile;

      reqUrl = req.url;
      // Sanitize URL; reduce multiple slashes to single slash
      reqUrl = reqUrl.replace(/\/{2,}/g, '/');
      // Strip trailing slash for the purpose of looking for a matching
      // route (will still check for directory + index on statics)
      // Don't strip if the entire path is just '/'
      reqUrl = reqUrl.replace(/(.+)\/$/, '$1');

      // Buffered request-obj -- buffer the request data,
      // and pass this proxy object to the controller
      reqObj = new Request(req);
      // Wrapped response-obj
      respObj = new Response(resp);

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
        urlParams = url.parse(reqUrl, true).query;

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
        , response: respObj
        , accessTime: accessTime
        });
        reqObj._geddyId = inFlightId;
        respObj._geddyId = inFlightId;

        // FIXME: Holy shit, all inline here
        // Probably should proxy events for wrapped Response obj
        respObj.resp.addListener('finish', function () {
          var id = respObj._geddyId
            , entry = geddy.inFlight.getEntry(id)
            , req = entry.request
            , stat = respObj.statusCode
            , endTime = new Date()
            , level = parseInt(stat, 10);

          // Status code representation for logging
          if (level > 499) {
            level = 'error';
          } else level = 'access';

          // Apache extended log-format
          geddy.log[level](req.connection.remoteAddress + ' ' +
            '- ' +
            '- ' +
            '[' + new Date(entry.accessTime) + '] ' +
            '"' + entry.method + ' ' + reqUrl + ' ' +
              req.httpVersion + '" ' +
            stat + ' ' +
            (respObj._length || '-') + ' ' +
            '"' + (req.headers['referer'] || '-') + '" ' +
            '"' + (req.headers['user-agent'] || '-') + '" ');

          geddy.inFlight.removeEntry(id);

          if (geddy.config.metrics) {
            allRequestTimer.update(endTime - accessTime);
            controllerActionTimers[controllerName] = controllerActionTimers[controller] || {};
            controllerActionTimers[controllerName][actionName] =
              controllerActionTimers[controllerName][actionName] ||
              geddy.metrics.Timer("Geddy."+controllerName + '.' + actionName);
            controllerActionTimers[controllerName][actionName].update(endTime - accessTime);
          }
        });

        params = router.first(reqUrl, method);
      }

      if (params) {
          controllerName = utils.string.camelize(params.controller, {initialCap: true});
          // Shim -- router now returns snakeized name
          params.controller = controllerName;
          actionName = params.action;
          ctor = ctors[controllerName];

          if (ctor) {
            // Merge params from the URL and the query-string to produce a
            // Grand Unified Params object
            geddy.mixin(params, urlParams);

            // If it's a plain form-post, save the request-body, and parse it into
            // params as well
            contentType = req.headers['content-type'];
            if ((req.method == 'POST' || req.method == 'PUT') &&
                (contentType &&
                  (contentType.indexOf('form-urlencoded') > -1 ||
                   contentType.indexOf('application/json') > -1))) {

              bodyParams = {};
              req.addListener('data', function (data) {
                body += data.toString();
              });
              // Parse the body into params once it's finished
              req.addListener('end', function () {
                if (contentType.indexOf('form-urlencoded') > -1) {
                  bodyParams = querystring.parse(body);
                }
                else if (contentType.indexOf('application/json') > -1) {
                  try {
                    bodyParams = JSON.parse(body);
                  }
                  catch (e) {}
                }
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
              appCtor.prototype.constructor = appCtor;
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
            ctor.prototype.constructor = ctor;
            // Instantiate the controller
            controller = new ctor();

            // Now that there's a controller, record the access-time
            controller.accessTime = accessTime;

            if (params.action == 'destroy' && typeof controller[params.action] != 'function') {
              params.action = 'remove';
            }

            if (typeof controller[params.action] == 'function') {
              controller.app = self;

              controller.request = reqObj;
              reqObj.controller = controller;
              controller.response = respObj;
              respObj.controller = controller;

              controller.method = method;
              controller.params = params;
              controller.name = params.controller;
              controller.i18n = new i18n.I18n(controller);

              // We have a controller instance; register it with the
              // in-flight data
              geddy.inFlight.updateEntry(reqObj._geddyId, {
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
              controller = new ErrorController(err, reqObj, respObj);
              controller.respond();
            }
          }
          // no controller, 500 error
          else {
            err = new errors.InternalServerError('controller ' +
                params.controller + ' not found.');
            controller = new ErrorController(err, reqObj, respObj);
            controller.respond();
          }
      }
      // Either static, 404, or 405
      else {
        // Get the path to the file
        staticPath = geddy.config.staticFilePath + reqUrl;
        // Ignore querystring
        staticPath = staticPath.split('?')[0];
        // Decode path (e.g. %20)
        staticPath = decodeURIComponent(staticPath);

        if (utils.file.existsSync(staticPath)) {
          // May be a path to a directory, with or without a trailing
          // slash -- any trailing slash has already been stripped by
          // this point
          if (fs.statSync(staticPath).isDirectory()) {
            // TODO: Make the name of any index file configurable
            staticPath = path.join(staticPath, 'index.html');
            if (utils.file.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
              controller = new StaticFileController(staticPath, reqObj, respObj);
              controller.respond();
            }
          }
          // Path to an actual file. Just serve it up
          else if (fs.statSync(staticPath).isFile()) {
            controller = new StaticFileController(staticPath, reqObj, respObj);
            controller.respond();
          }
        }
        // 405?
        else {
          nonMethodRoutes = router.all(reqUrl);
          if (nonMethodRoutes.length) {
            // build a unique list of acceptable methods for this resource
            acceptableMethods = {};
            nonMethodRoutes.map(function (params) {
              acceptableMethods[params.method] = true;
            });
            acceptableMethods = Object.keys(acceptableMethods);

            // send a friendly error response
            err = new errors.MethodNotAllowedError(
              method + ' method not allowed. Please consider ' +
              acceptableMethods.join(', ').replace(/,\s(\w+)$/," or $1") +
              ' instead.');
            errResp = new response.Response(resp);
            errResp.send( err.message, err.statusCode, {'Content-Type': 'text/html'} );

          }
          // 404
          else {
            err = new errors.NotFoundError(reqUrl + ' not found.');
            controller = new ErrorController(err, reqObj, respObj);
            controller.respond();
          }

        }
      }
    });

    _afterStart();
    callback();
  };

};

module.exports.App = App;

