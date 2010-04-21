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

var fleegix = require('geddy/lib/fleegix');

var Config = require('geddy/lib/config').Config;
var Init = require('geddy/lib/init').Init;
var App = require('geddy/lib/app').App;

var runServ = function () {
  http.createServer(function (req, resp) {
    new App().run(req, resp);
  }).listen(config.port);

  sys.puts('Server running at http://127.0.0.1:' + config.port + '/');
};

var config = new Config(appDirname);
// Initialize the app, passing in the config, and runServ at its callback
new Init(config, runServ);


