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
  , utils = require(__dirname + '/utils/index')
  , Worker = require(__dirname + '/worker').Worker
  , FunctionRouter = require(__dirname + '/routers/function_router').FunctionRouter
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

    worker.config = geddy.mixin({}, config, appConfig, true);

    this.config = worker.config;
    this.server = worker.server;
    this.worker = worker;

    router = require(dir + '/config/router');

    // Load controller ctors
    dirname = '/app/controllers'
    dirList = fs.readdirSync(dir + dirname)
    ctors = _getControllerConstructors(dirname, dirList)

    router = router.router || router;

    if (ctors.Application) {
      ctor = ctors.Application;
      baseController = utils.enhance(new BaseController(), new ctor());
    }
    else {
      baseController = new BaseController();
    }

    // Handle the requests
    this.server.addListener('request', function (req, resp) {
      //TODO: get better logs (including http status codes) by wrapping serverResponse.end()
      req.addListener('end', function () {
        var ctor
          , clr
          , params;
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
          ctor.prototype = utils.enhance(baseController, ctor.prototype);
          clr = new ctor();
          clr.request = req;
          clr.response = resp;
          clr.params = params;
          clr._handleAction.call(clr, params.action);
        }
        else {
          // TODO Throw a 500?
          console.log('No controller found for ' + JSON.stringify(params));
        }
      }

      // TODO: if possible, add back in metrics
    });

  };
  this.log = worker.log;
})());

global.geddy = geddy;

worker.start(function () {
  geddy.start();
});
