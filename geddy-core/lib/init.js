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

var fleegix = require('geddy-core/lib/fleegix');
var session = require('geddy-core/lib/session');
var Init = function (config, callback) {

  var _this = this;
  var _callback = callback;

  geddy.config = config;
  // The app's instantiated Router
  geddy.router = require(geddy.config.dirname + '/config/router').router;
  geddy.model = require('geddy-model/lib/model');
  geddy.hooks = require('geddy-core/lib/hooks');
  geddy.inflections = require(geddy.config.dirname + '/config/inflections');

  global.controllerRegistry = {};
  global.templateRegistry = {};
  global.pluginRegistry = {};
  
  // Load anything in from the app's local init
  var localInit = require(geddy.config.dirname + '/config/init');
  for (var p in localInit) {
    global[p] = localInit[p];
  }

  this.registerControllers = function (err, dirList) {
    if (err) {
      sys.puts('Error: ' + JSON.stringify(err));
    }
    else {
      controllerRegistry = geddy.util.meta.registerConstructors('/app/controllers/', dirList);
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
          file = file.replace(geddy.config.dirname + '/', '');
          templates[file] = true;
        }
      }
      templateRegistry = templates;
    }
  };

  this.loadDBAdapter = function () {
    var adapterPath = 'geddy-model/lib/adapters/' + geddy.config.database.adapter;
    var adapt = require(adapterPath);
    geddy.model.setDbAdapter(adapt);
  };

  this.loadPlugins = function () {
    var plugins = geddy.config.plugins;
    var path;
    var pathName;
    var cfg;
    for (var pluginName in plugins) {
      cfg = plugins[pluginName];
      pathName = fleegix.string.deCamelize(pluginName);
      path = geddy.config.dirname + '/plugins/' + pathName + '/' + pathName;
      pluginRegistry[pluginName] = new require(path)[pluginName](cfg);
    }
  };

  // Synchronous actions
  // ----------
  if (geddy.config.database) {
    this.loadDBAdapter();
  }
  this.loadPlugins();

  // Asynchronous actions
  // ----------
  var group = new geddy.util.async.AsyncChain([
    {
      func: session.createStore,
      args: [geddy.config.sessions.store],
      callback: null
    },
    {
      func: fs.readdir,
      args: [geddy.config.dirname + '/app/models'],
      callback: geddy.model.registerModels
    },
    {
      func: fs.readdir,
      args: [geddy.config.dirname + '/app/controllers'],
      callback: this.registerControllers
    },
    {
      func: child_process.exec,
      args: ['find ' + geddy.config.dirname + '/app/views'],
      callback: this.registerTemplates
    }
  ]);
  
  group.last = _callback;
  group.run();

};

exports.Init = Init;
