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

var appDirname = process.argv[2];

var sys = require('sys');
var http = require('http');

var fleegix = require('geddy-core/lib/fleegix');

var Config = require('geddy-core/lib/config').Config;
var Init = require('geddy-core/lib/init').Init;
var App = require('geddy-core/lib/app').App;
var config;

var runServ = function () {
  var hostname;
  if (config.hostname) { hostname = config.hostname; }
  http.createServer(function (req, resp) {
    new App().run(req, resp);
  }).listen(config.port, hostname);

  var msg = 'Server running at ';
  msg += hostname ? 'http://' + hostname + ':' + config.port : 'port ' + config.port
  sys.puts(msg);
};

config = new Config(appDirname);
// Initialize the app, passing in the config, and runServ at its callback
new Init(config, runServ);


