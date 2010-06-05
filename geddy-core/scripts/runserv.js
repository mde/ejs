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

var req, resp, errors, appDirname, config, http,
    parseopts, Config, Init, App, args, opts, sys;

global.geddy = require('geddy-core/lib/geddy');

// Start grabbing errors first thing -- we need to be able
// to report the entire stack, not just what the child process
// gets on stderr
// FIXME: Need to find out why errors thrown inside the local
// function below don't get caught, but still get suppressed.
// This is why we need the try/catch inside runServ
process.addListener('uncaughtException', function (err) {
  // If the app is running and there's a request in-process,
  // Dump the error into the browser as an HTTP error page
  if (resp) {
    errors.respond(resp, err);
  }
  // If the app is in the process of starting up, display
  // the entire stack, then send the parent process the
  // signal to shut down
  else {
    var msg = '';
    msg += 'Error starting up application.\n';
    msg += err.stack ? err.stack.toString() : '';
    sys.puts(msg);
    // FIXME: This is a hack -- figure out a better way to
    // tell the parent to shut down
    sys.debug('###shutdown###');
  }
});
  
sys = require('sys');
appDirname = process.argv[2];
http = require('http');
parseopts = require('geddy-core/lib/parseopts');
Config = require('geddy-core/lib/config').Config;
Init = require('geddy-core/lib/init').Init;
args = process.argv.slice(2);
opts = parseopts.parse(args);

// Add the local lib/ and vendor/ dirs in the app as a require-lookup path
require.paths.unshift(opts.geddyRoot + '/lib/');
require.paths.unshift(opts.geddyRoot + '/vendor/');

var runServ = function () {
  var hostname;
  if (config.hostname) { hostname = config.hostname; }
  http.createServer(function (request, response) { req = request;
    resp = response;
    // Errors thrown here don't get caught by uncaughtExceptions listener
    // FIXME: figure out why, try to unify error-handling in one place
    try {
      new App().run(req, resp);
    }
    catch (e) {
      errors.respond(resp, e);
    }

  }).listen(config.port, hostname);

  // Report server-start in initial startup -- don't report on
  // bounces from file-changes in dev-mode
  if (!opts.restart) {
    var msg = 'Geddy running ';
    msg += opts.serverRoot ? 'from source (' + opts.serverRoot + ') ' : '';
    msg += 'at ';
    msg += hostname ? 'http://' + hostname + ':' + config.port : 'port ' + config.port
    if (config.environment == 'development') {
      msg += ' (development mode)'
    }
    sys.puts(msg);
  }
};

config = new Config(opts);
// Initialize the app, passing in the config, and runServ at its callback
new Init(config, runServ);
// Get the app constructor, once init has completed
App = require('geddy-core/lib/app').App;
// Errors consumes logs, logs needs config to be set up
// so do this last
errors = require('geddy-core/lib/errors');


