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
  , errors = require(__dirname + '/errors')
  , response = require(__dirname + '/response')
  , utils = require(__dirname + '/utils/index')
  , Worker = require(__dirname + '/worker').Worker
  , FunctionRouter = require(__dirname + '/routers/function_router').FunctionRouter
  , RegExpRouter = require(__dirname + '/routers/regexp_router').RegExpRouter
  , BaseController = require(__dirname + '/base_controller').BaseController
  , dir = process.cwd()
  , worker = new Worker()
  , vm = require('vm');

geddy.mixin = utils.mixin
geddy.objectToString = utils.objectToString; // Get rid of this
geddy.string = utils.string;
geddy.async = utils.async;
geddy.uri = utils.uri;

geddy.mixin(geddy, new (function () {

  var _getControllerConstructors = function (dirname, dirList) {
        var fileName
          , filePath
          , ctorName
          , ctors = {}
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
        return ctors;
      };

  this.config = null;
  this.server = null;
  this.worker = null;
  this.FunctionRouter = FunctionRouter;
  this.RegExpRouter = RegExpRouter;

  this.start = function () {
    var self = this
      , router
      , dirname
      , filename
      , dirList
      , ctors
      , ctor
      , baseController
      , config = worker.config
      , appConfig;

    dirname = '/config';
    filename = dirname + '/' + config.environment + '.js';
    appConfig = vm.runInThisContext(fs.readFileSync(dir + filename).toString());

    config = geddy.mixin({}, config, appConfig, true);

    this.config = config;
    this.server = worker.server;
    this.worker = worker;

    router = require(dir + '/config/router');

    // Load controller ctors
    dirname = '/app/controllers';
    dirList = fs.readdirSync(dir + dirname);
    ctors = _getControllerConstructors(dirname, dirList);

    for (var p in ctors) {
      ctor = ctors[p];
      ctor.origPrototype = ctor.prototype;
    }

    router = router.router || router;

    // Handle the requests
    this.server.addListener('request', function (req, resp) {
      var params
        , urlParams
        , ctor
        , appCtor
        , clr
        , staticPath
        , staticResp
        , err
        , errResp
        , body = ''
        , bodyParams
        , steps = {
            parseBody: false
          , session: false
          }
        , finish = function (step) {
            steps[step] = true;
            for (var p in steps) {
              if (!steps[p]) {
                return false;
              }
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
            clr = new ctor();
            clr.request = req;
            clr.response = resp;
            clr.params = params;
            clr.name = params.controller;
            clr._handleAction.call(clr, params.action);
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


        // TODO: Async session access
        finish('session');

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
        staticPath = geddy.config.staticFilePath + '/' + req.url;
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
  geddy.start();
});
