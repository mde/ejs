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

var fs = require('fs');
var sys = require('sys');
var child_process = require('child_process');
//var chexec =

var fleegix = require('geddy-core/lib/fleegix');
var session = require('geddy-core/lib/session');
var hooks = require('geddy-core/lib/hooks');
var meta = require('geddy-util/lib/meta');
var async = require('geddy-util/lib/async');
var model = require('geddy-model/lib/model');

var Init = function (config, callback) {

  var _this = this;
  var _callback = callback;

  GLOBAL.util = {};
  GLOBAL.util.meta = require('geddy-util/lib/meta');
  GLOBAL.util.string = require('geddy-util/lib/string');
  GLOBAL.controllerRegistry = {};
  GLOBAL.templateRegistry = {};
  GLOBAL.pluginRegistry = {};
  GLOBAL.config = config;
  GLOBAL.router = require(config.dirname + '/config/router').router;
  GLOBAL.hooks = hooks;

  this.registerControllers = function (err, dirList) {
    if (err) {
      sys.puts('Error: ' + JSON.stringify(err));
    }
    else {
      controllerRegistry = meta.registerConstructors('/app/controllers/', dirList);
    }
  };

  this.registerTemplates = function (err, stdin, stderr) {
    if (err) {
      sys.puts('Error: ' + JSON.stringify(err));
    }
    else if (stderr) {
      sys.puts('Error: ' + stderr);
    }
    else {
      var templates = {};
      var files = stdin.split('\n');
      var file;
      var pat = /\.ejs$/;
      for (var i = 0; i < files.length; i++) {
        file = files[i];
        if (pat.test(file)) {
          file = file.replace(config.dirname + '/', '');
          templates[file] = true;
        }
      }
      templateRegistry = templates;
    }
  };

  this.loadPlugins = function () {
    var plugins = config.plugins;
    var path;
    var pathName;
    var cfg;
    for (var pluginName in plugins) {
      cfg = plugins[pluginName];
      pathName = fleegix.string.deCamelize(pluginName);
      path = config.dirname + '/plugins/' + pathName + '/' + pathName;
      pluginRegistry[pluginName] = new require(path)[pluginName](cfg);
    }
  };

  // Synchronous actions
  // ----------
  this.loadPlugins();

  // Asynchronous actions
  // ----------
  var group = new async.AsyncGroup([
    {
      func: session.createStore,
      args: [config.sessions.store],
      callback: null
    },
    {
      func: fs.readdir,
      args: [config.dirname + '/app/models'],
      callback: model.registerModels
    },
    {
      func: fs.readdir,
      args: [config.dirname + '/app/controllers'],
      callback: this.registerControllers
    },
    {
      func: child_process.exec,
      args: ['find ' + config.dirname + '/app/views'],
      callback: this.registerTemplates
    }
  ]);
  
  group.last = _callback;
  group.run();

};

exports.Init = Init;
