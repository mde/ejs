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

var geddy
  , fs = require('fs')
  , utils = require(__dirname + '/utils/index')
  , string = require(__dirname + '/utils/string').string
  , Worker = require(__dirname + '/worker')
  , FunctionRouter = require(__dirname + '/routers/function_router').FunctionRouter
  , dir = process.cwd()
  , worker = new Worker();

geddy = new (function () {

  var _getControllerConstructors = function (dirname, dirList) {
    var fileName
      , filePath
      , constructorName
      , constructors = {}
      , jsPat = /\.js$/;

    // Dynamically create constructor constructors from files in constructors/
    for (var i = 0; i < dirList.length; i++) {
      fileName = dirList[i];
      // Any files ending in '.js' -- e.g., 'neil_pearts.js'
      if (jsPat.test(fileName)) {
        // Strip the '.js', e.g., 'neil_pearts'
        fileName = fileName.replace(jsPat, '');
        // Convert underscores to camelCase with initial cap, e.g., 'NeilPearts'
        constructorName = string.camelize(fileName, true);
        filePath = dir + dirname + '/' + fileName;
        // Registers as a constructor, e.g., constructors.NeilPearts =
        //    require('/path/to/geddy_app/<dirname>/neil_pearts').NeilPearts
        constructors[constructorName] = require(filePath)[constructorName];
      }
    }
    return constructors;
  };

  this.config = worker.config;
  this.server = worker.server;
  this.string = string;
  this.FunctionRouter = FunctionRouter;

  this.start = function () {
    var self = this
      , router = require(dir + '/config/router');

    // Load controller constructors
    var dirname = '/app/controllers'
      , dirList = fs.readdirSync(dir + dirname)
      , constructors = _getControllerConstructors(dirname, dirList)
      , baseController;

    router = router.router || router;

    if (constructors.Application) {
      baseController = new constructors.Application();
    }

    // Handle the requests
    this.server.addListener('request', function (req, resp) {
      //TODO: get better logs (including http status codes) by wrapping serverResponse.end()
      req.addListener('end', function () {
        var ctor
          , controller
          , params;
        self.log.access(req.connection.remoteAddress +
            " " + new Date() + " " + req.method + " " + req.url);
      });
      self.requestTime = (new Date()).getTime();

      if (router) {
        params = router.first(req);
      }
      if (params) {
        ctor = constructors[params.controller];
        console.log(constructors);
        console.log(params.controller);
        console.log(ctor);
        if (ctor) {
          controller = new ctor();
          controller.request = req;
          controller.response = resp;
          controller[params.action].call(controller, params);
        }
      }

      // TODO: if possible, add back in metrics
    });

  };
  this.log = worker.log;
})();

global.geddy = geddy;

worker.start();
geddy.start();
