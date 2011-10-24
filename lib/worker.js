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
/* TODO:
1. implement healthchecks application side
2. implement handlerTimers per handler
3. Implement a RoutingEngine
*/

var net = require('net')
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , utils = require('./utils')
  //, metric = require('./metric')
  , spawn = require('child_process').spawn;

var _modes = {
  UNSTARTED: 'unstarted'
, STARTED: 'started'
, RETIRED: 'retired'
, SHUTDOWN: 'shutdown'
};

var Log = function (worker) {
  var self = this
    , types = [
        'debug'
      , 'info'
      , 'notice'
      , 'warning'
      , 'error'
      , 'critical'
      , 'alert'
      , 'emergency'
      , 'access'
      ]
    , type
    , loggerCreator = function (t) {
        return function (msg) {
          self.worker.sendMessage({method: 'log', logType: t, message: msg});
        };
      };

  this.worker = worker;

  for (var i = 0, ii = types.length; i < ii; i++) {
    type = types[i];
    this[type] = loggerCreator(type);
  }
};

/**
 * @constructor Creates instances of proxy-server workers that
 * handle HTTP requests
 */
var ROUTE_TIMEOUT = 3000;
var Worker = function () {
  this._geddyStarter = null;
  this.config = {};
  this.configured = false;
  this.allowedOrigins = {};
  this.server = http.createServer();
  this.mode = _modes.UNSTARTED;
  this.requestTime = null;
  this.inFlight = {};
  this.handlerId = 0;
  this.inFlightIntervalId = null;
  this.messageParser = null;
  this.handlerTimers = {};
  this.log = new Log(this);
  this.stdin = null;
  this.init();
  // A shared object that all handlers running on the worker can use, if they want
  this.shared = {};
  this.readyQueue = [];
};

Worker.prototype = new function () {

  this.onReady = function onReady(fn) {
    if (this.configured) {
      fn();
    } else {
      this.readyQueue.push(fn);
    }
  };

  this.shutdownServer = function shutdownServer() {
    this.sendMessage({method: 'shutdown'});
  };

  /* Wait for our routes to be set */
  this.init = function () {
    var self = this;
      /*
      , areWeReadyYet = setInterval(function () {
        if (self.router && self.router.routes) {
          clearInterval(areWeReadyYet);
          clearTimeout(noRoutes);
          self.start();
        }
      }, 200)
      , noRoutes = setTimeout(function () {
        self.log.error('No routes defined after 30 seconds.  Exiting...');
        process.exit(1);
      }, ROUTE_TIMEOUT);
      */

    // Global handle for error handling.
    process.worker = self;

    // This process listens on stdin to communicate with the parent.
    self.stdin = new net.Stream(0, 'unix');

    // Setup our server process,
    // Listen on the passed-in shared FD and open it
    self.stdin.addListener('fd', function (fd) {
      if (self.mode == _modes.UNSTARTED) {
        self.mode = _modes.STARTED;
        self.server.listenFD(fd, 'tcp4');
      }
    });
    self.stdin.addListener('data', function (data) {
      self.receiveMessage(data);
    });
    // We resume stdin on start()
  };

  this.configure = function (cfg) {
    this.config = cfg;
    this.configured = true;
    for(var i = 0, ii = this.readyQueue.length; i < ii; ++i) {
      this.readyQueue[i]();
    }
    this._geddyStarter(cfg);
  };

  /*  Functions that can be called from Master Server  */
  var _dispatch = {
    config: function (msg) {
      this.configure(msg.data);
      this.log.notice('Server worker running in ' + this.config.environment + ' with a PID of: ' + process.pid);
      this.log.debug('LOGGING STARTED ============================================');
      this.log.debug('============================================================');
    }
  , retire: function (msg) {
      var self = this;
      this.server.addListener('close', function () {
        self.mode = _modes.RETIRED;
        self.watchInFlight();
      });
      this.server.close();
    }
  , shutdown: function (msg) {
      this.mode = _modes.SHUTDOWN;
      this.watchInFlight();
    }
  };


  /*  Process Communication  */

  this.receiveMessage = function (d) {
    this.messageParser.handle(d);
  };

  this.sendMessage = function (msg) {
      var output = JSON.stringify(msg);
      process.stdout.write(output + '\n');
  };



  /*  Gracefully kill requests that take too long during shutdown */
  this.watchInFlight = function () {
    var self = this
      , start = (new Date()).getTime();
    this.inFlightIntervalId = setInterval(function () {
      var reg = self.inFlight
        , found
        , timedOut = (new Date()).getTime() - start > self.config.gracefulRestartTimeout;
      if (timedOut) {
        for (var p in reg) {
          reg[p].serverResponse.end();
        }
        found = false;
      }
      else {
        for (var p in reg) {
          found = true;
        }
      }
      if (!found) {
        clearInterval(self.inFlightIntervalId);
        // Send the shutdown message
        self.sendMessage({method: self.mode});
      }
    }, 2000);
  };


  /*  Begin handling requests  */
  this.start = function (callback) {
    this._geddyStarter = callback;
    var self = this;
    this.messageParser = new utils.MessageParser(_dispatch, this);

    // Tell the master we're alive
    setInterval(function () {
      self.sendMessage({method: 'heartbeat'});
    }, 5000);

    // Get the hostname
    this.hostname = '';
    hostproc = spawn('hostname');
    hostproc.stdout.on('data', function (data) {
      self.hostname += data;
    });
    hostproc.stdout.on('end', function () {
      self.hostname = self.hostname.replace('/\s+$/', '');
    });


    self.stdin.resume();
  };
};

exports.Worker = Worker;
