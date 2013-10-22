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

var domain = require('domain')
  , fs = require('fs')
  , path = require('path')
  , model = require('model')
  , controller = require('../controller')
  , utils = require('../utils')
  , cwd = process.cwd()
  , errors = require('../response/errors')
  , init = require('../init')
  , helpers = require('../template/helpers')
  , actionHelpers = require('../template/helpers/action')
  , ErrorController = require('../controller/error_controller').ErrorController
  , StaticFileController =
        require('../controller/static_file_controller').StaticFileController
  , controllerInit = require('../controller/init')
  , InFlight = require('../in_flight').InFlight
  , sessions = require('../sessions')
  , usingCoffee // Global variable for CoffeeScript
  , logging = require('./logging')
  , requestHelpers = require('./request_helpers');

// Set up a bunch of aliases
geddy.inFlight = new InFlight();
geddy.inflection = utils.inflection;
geddy.model = model;
geddy.controller = controller;
geddy.utils = utils;
geddy.errors = errors;
geddy.viewHelpers = {};

// Use Geddy logger as the utility logger
utils.log.registerLogger(geddy.log);

var App = function () {

  // Init core -- eventually all init should move here
  // ==================
      _baseInit = function (next) {
        init.init(this, next);
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
        var viewsPath = path.normalize('app/views')
          , geddyTemplatesPath = path.join(__dirname, '../template', 'templates');

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
                file: file
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
                origFile = path.normalize('geddy/' + fileBaseName);
              }

              if (pat.test(file)) {
                // Strip .html and extension for easier detecting when rendering
                if (isGeddy) {
                  noExtFile = path.normalize('geddy/' + fileBaseName);
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

          , registerEventListener = function (model, ev) {
            geddy.model[model].on(ev, function (d) {
              var data
                , id;

              ev = ev.replace('before', '').toLowerCase();

              if (typeof d == 'object') {
                data = d;
                data.model = model;
                data.event = ev;
                id = data.id;
                data = data.toJSON();
              }
              else {
                id = data;
                data = {id: id};
                data.model = model;
                data.event = ev;
                data = JSON.stringify(data);
              }

              geddy.io.sockets.emit(model + ':' + ev, data);
              geddy.io.sockets.emit(model + ':' + ev + ':' + id, data);
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
    , _loadSessionStore
    , _registerTemplatePaths
    ];

    chain = new utils.async.SimpleAsyncChain(items, this);
    chain.last = function () {
      self.start(callback);
    };
    chain.run();
  };

  this.handleControllerAction = function (controllerInst, reqUrl, method,
          params, accessTime, reqObj, respObj) {
    var initKeys
      , initializer
      , cb;

    // Async setup steps to allow the controller to handle
    // the request
    initKeys = [
      'cookies'
    , 'i18n'
    , 'inFlight'
    , 'parseBody'
    , 'session'
    ];

    // Mix all the shits onto the controller instance
    utils.mixin(controllerInst, {
      app: this
    , url: reqUrl  // Can we dispense with this? It's in the params
    , method: method // And this?
    , params: params
    , accessTime: accessTime
    , request: reqObj
    , response: respObj
    , name: params.controller
    });

    reqObj.controller = controllerInst;
    respObj.controller = controllerInst;

    cb = function () {
      controllerInst._handleAction.call(controllerInst, params.action);
      // TODO Replace this with readable-stream module for 0.8 support
      if (reqObj.req && typeof reqObj.req.read != 'function') {
        reqObj.sync(); // Flush buffered events and begin emitting
      }
    };
    initializer = new utils.async.Initializer(initKeys, cb);

    // Run all the async setup steps
    initKeys.forEach(function (key) {
      controllerInit[key].call(controllerInst, function () {
        initializer.complete(key);
      });
    });
  };

  this.handleStaticFile = function (staticPath, params, reqUrl, reqObj, respObj) {
    var controllerInst;
    // May be a path to a directory, with or without a trailing
    // slash -- any trailing slash has already been stripped by
    // this point
    if (fs.statSync(staticPath).isDirectory()) {
      // TODO: Make the name of any index file configurable
      staticPath = path.join(staticPath, 'index.html');
      if (utils.file.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        controllerInst = new StaticFileController(reqObj, respObj, params);
        controllerInst.respond({
          path: staticPath
        });
      }
      // Directory with no index file
      else {
        this.handleNotFound(reqUrl, params, reqObj, respObj);
      }
    }
    // Path to an actual file. Just serve it up
    else if (fs.statSync(staticPath).isFile()) {
      controllerInst = new StaticFileController(reqObj, respObj, params);
      controllerInst.respond({
        path: staticPath
      });
    }
  };

  this.handleMethodNotAllowed = function (method, reqUrl, params, reqObj, respObj,
      nonMethodRoutes) {
    // build a unique list of acceptable methods for this resource
    var acceptableMethods = {}
      , err
      , controllerInst;

    nonMethodRoutes.map(function (params) {
      acceptableMethods[params.method] = true;
    });
    acceptableMethods = Object.keys(acceptableMethods);

    // send a friendly error response
    throw new errors.MethodNotAllowedError(
      method + ' method not allowed. Please consider ' +
      acceptableMethods.join(', ').replace(/,\s(\w+)$/," or $1") +
      ' instead.');
  };

  this.handleNotFound = function (reqUrl, params, reqObj, respObj) {
    throw new errors.NotFoundError(reqUrl + ' not found.');
  };

  this.handleNoMatchedRoute = function (method, reqUrl, params, reqObj, respObj) {
    var staticPath
      , controllerInst
      , nonMethodRoutes;


    // Get the path to the file, decoding the request URI
    staticPath = geddy.config.staticFilePath + decodeURIComponent(reqUrl);
    // Ignore querystring
    staticPath = staticPath.split('?')[0];

    // Static?
    if (utils.file.existsSync(staticPath)) {
      this.handleStaticFile(staticPath, params, reqUrl, reqObj, respObj, params);
    }
    else {
      nonMethodRoutes = this.router.all(reqUrl);

      // Good route, wrong verb -- 405?
      if (nonMethodRoutes.length) {
        this.handleMethodNotAllowed(method, reqUrl, params, reqObj, respObj,
          nonMethodRoutes);
      }
      // Nada, 404
      else {
        this.handleNotFound(reqUrl, params, reqObj, respObj);
      }
    }
  };
  this.handleNoAction = function (params, reqObj, respObj) {
    throw new errors.InternalServerError('No ' + params.action +
        ' action on ' + params.controller + ' controller.');
  };

  this.handleNoController = function (params, reqObj, respObj) {
    throw new errors.InternalServerError('controller ' +
        params.controller + ' not found.');
  };

  this.start = function (callback) {
    var self = this
      , ctors = this.controllerRegistry
      , controllerActionTimers = {};

    // Handle the requests
    // ==================
    geddy.server.addListener('request', function (req, resp) {
      var dmn = domain.create()
        , caught = false
        , badRequestErr
        , controllerInst
        , reqObj
        , respObj;

      // Attempt a nice, high-fi customizable error
      // Only try this once -- if something fails during the
      // rendering process for the error, fall back to a low-fi
      // fool-proof error to display that
      dmn.on('error', function (err) {
        var serverErr
          , controllerInst;

        if (caught) {
          return errors.respond(err, respObj);
        }

        caught = true;

        if (err.statusCode) {
          serverErr = err;
        }
        else {
          serverErr = new errors.InternalServerError(err.message, err.stack);
        }

        try {
          controllerInst = new ErrorController(reqObj, respObj);
          controllerInst.respondWith(serverErr);
        }
        // Catch sync errors in the error-rendering process
        // Respond with a low-fi fool-proof err
        // Async ones will be handled by re-entering this domain
        // on-error handler
        catch(e) {
          errors.respond(e, respObj);
        }
      });

      dmn.add(req);
      dmn.add(resp);

      // Parsing URLs may result in a bad request -- if this happens,
      // throw the error inside the domain code, so we can get a nice,
      // customizable error message
      try {
        reqObj = requestHelpers.enhanceRequest(req);
        respObj = requestHelpers.enhanceResponse(resp);
      }
      catch (err) {
        req.url = '/';
        reqObj = requestHelpers.enhanceRequest(req);
        respObj = requestHelpers.enhanceResponse(resp);
        badRequestErr = new errors.BadRequestError(err.message, err.stack);
        controllerInst = new ErrorController(reqObj, respObj);
        return controllerInst.respondWith(badRequestErr);
      }

      dmn.add(reqObj);
      dmn.add(respObj);

      dmn.run(function () {
        var reqUrl
          , urlParams
          , method
          , accessTime
          , params
          , controllerInst;

        // Parse out some needed request properties
        reqUrl = requestHelpers.normalizeUrl(req);
        urlParams = requestHelpers.getUrlParams(reqUrl);
        method = requestHelpers.getMethod(reqUrl, urlParams, req);
        accessTime = requestHelpers.getAccessTime();

        // Now only for timeout, domains are handling errors
        requestHelpers.initInFlight(reqObj, respObj, method, accessTime);

        // TODO: Allow custom formats
        logging.initRequestLogger(reqUrl, reqObj, respObj, method, accessTime);

        params = requestHelpers.getParams(self.router, reqUrl, method);
        // Route/method combo give us something valid?
        if (params) {

          controllerInst = controller.create(params.controller);
          // Valid controller?
          if (controllerInst) {
            // Enhance the parsed params with URL params
            geddy.mixin(params, urlParams);

            // FIXME: Backward-compat shim for old action-name 'destroy'
            if (params.action == 'destroy' &&
                typeof controllerInst.destroy != 'function') {
              params.action = 'remove';
            }

            if (typeof controllerInst[params.action] == 'function') {
              self.handleControllerAction(controllerInst, reqUrl, method,
                      params, accessTime, reqObj, respObj);
            }
            // No action, 500 error
            else {
              self.handleNoAction(params, reqObj, respObj);
            }
          }
          // No controller, 500 error
          else {
            self.handleNoController(params, reqObj, respObj);
          }
        }
        // Either 405, static, or 404
        else {
          self.handleNoMatchedRoute(method, reqUrl, params, reqObj, respObj);
        }

      });
    });

    _afterStart();
    callback();
  };

};

module.exports.App = App;

