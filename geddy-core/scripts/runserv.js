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

// Make geddy the sole global
global.geddy = require('geddy-core/lib/geddy');

// Bare min for reporting errors on startup
var sys = require('sys');

// Start grabbing errors first thing -- we need to be able
// to report the entire stack, not just what the child process
// gets on stderr
// FIXME: Need to find out why errors thrown inside the local
// function below don't get caught, but still get suppressed.
// This is why we need the try/catch inside runServ
process.addListener('uncaughtException', function (err) {
  // If the app is running and there's a request in-process,
  // Dump the error into the browser as an HTTP error page
  if (geddy.request) {
    errors.respond(geddy.response, err);
  }
  // If the app is in the process of starting up, display
  // the entire stack, then send the parent process the
  // signal to shut down
  else {
    var msg = '';
    msg += 'Error starting up application.\n';
    msg += err.stack ? err.stack.toString() : '';
    sys.puts(msg);
    // Die
    sys.debug('###shutdown###');
  }
});
  
var errors, config, App, fd;
var appDirname = process.argv[2],
    net = require('net'),
    http = require('http'),
    parseopts = require('geddy-core/lib/parseopts'),
    Config = require('geddy-core/lib/config').Config,
    Init = require('geddy-core/lib/init').Init,
    args = process.argv.slice(2),
    parsed = parseopts.parse(args),
    cmds = parsed.cmds,
    opts = parsed.opts;

// Add the local lib/ and vendor/ dirs in the app as a require-lookup path
require.paths.unshift(opts.geddyRoot + '/lib/');
require.paths.unshift(opts.geddyRoot + '/vendor/');

/*
 * Main server startup function, invoked as a callback
 * from the init function 
 */
var runServ = function () {
  var server = http.createServer();
  var hostname = geddy.config.hostname || undefined;
  server.addListener('request', function (req, resp) {
    // Errors thrown here don't get caught by uncaughtExceptions listener
    // FIXME: Try to unify error-handling
    try {
      geddy.app.handleReq(req, resp);
    }
    catch (e) {
      errors.respond(resp, e);
    }

  });
  // Listen on the passed-in fd
  server.listenFD(fd, 'tcp4');

  // Server startup banner
  // TODO: Move banner up to master process
  if (!opts.restart) {
    var msg = 'Geddy worker (pid ' + process.pid + ') running ';
    msg += opts.serverRoot ? 'from source (' + opts.serverRoot + ') ' : '';
    msg += 'at ';
    msg += hostname ? 'http://' + hostname + ':' + geddy.config.port : 'port ' + geddy.config.port
    if (geddy.config.environment == 'development') {
      msg += ' (development mode)'
    }
    sys.puts(msg);
  }
};

// Listen on stdin
var stdin = new net.Stream(0, 'unix');

stdin.addListener('data', function (data) {
  // TODO: Pass in config here
  var config = JSON.parse(data.toString());
});

stdin.addListener('fd', function (f) {
  // Grab the fd to listen on
  fd = f;
  
  // App-config -- base config is overridden by opts
  config = new Config(opts);

  // Initialize with the config, then fire up the app
  // with the callback
  new Init(config, function () {
    // Errors current use logging -- logs needs the config to be set up
    errors = require('geddy-core/lib/errors');
    
    // All righty, fire up the app
    App = require('geddy-core/lib/app').App;
    geddy.app = new App();

    runServ(); 
  });

});

stdin.resume();






