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

var VERSION = '0.1.0'
  , RETIREMENT_WINDOW = 5 * 60 * 1000
  , ROTATION_WINDOW = 2 * 60 * 60 * 1000
  , binding = process.binding('net')
  , net = require('net')
  , childProcess = require('child_process')
  , fs = require('fs')
  , Log = require('../deps/log')
  , utils = require('utilities')
  , metrics
  , Parser
  , optsReg
  , parsed
  , opts
  , pids = ''
  , shutdownMode = false
  , restartMode = false;

/**
 * @namespace The server
 */
var server = module.exports = new function () {
  // Private vars
  // -------------
  // The file-descriptor shared with all the worker-processes
  var _fd;

  // Public properties
  // -------------
  // Passed-in opts
  this.opts = null;

  // Base config, can be overridden by opts passed to `start`
  this.config = {
  // Default to prod
    environment: 'production'
  // Number of worker-processes to spawn
  , workers: 2
  // Port to listen on
  , port: 4000
  // Set stdout to debug log-level
  , debug: false
  // Use worker-process rotation
  , rotateWorkers: true
  // How long for a full rotation
  , rotationWindow: 2 * 60 * 60 * 1000
  // Default logfile location
  , logDir: process.cwd() + '/log'
  // How long to wait for in-flight requests before killing
  , gracefulRestartTimeout: 60000
  // Number of milliseconds old a heartbeat-timestamp can be
  // before killing the worker process
  , heartbeatWindow: 20000
  // Place to look for static content to serve in dev-mode
  , staticFilePath: process.cwd() + '/public'
  // Default session-settings -- setting to null will mean no sessions
  , sessions: {
      store: 'memory',
      key: 'sid',
      expiry: 14 * 24 * 60 * 60
    }
  // Key for when using Cookie session-store
  , cookieSessionKey: 'sdata'
  };
  // Registry of the worker-processes
  this.workers = {};
  // List of the worker-PIDs, in order
  this.workerPidList = [];

  // Metrics Server
  this.metricsServer = null;

  // Private functions
  // -------------
  var _readConfig = function () {
        var opts = this.opts
          , dir = process.cwd()
          , baseConfig = require(dir + '/config/environment.js')
          , envConfig;

        this.config.environment = opts.environment || this.config.environment;
        envConfig = require(dir + '/config/' + this.config.environment + '.js');

        // Start with a blank slate, mix everything in
        utils.mixin(this.config, baseConfig);
        utils.mixin(this.config, envConfig);
        utils.mixin(this.config, opts);
        if (this.config.workers < 2) {
          this.config.rotateWorkers = false;
        }
      }
  /**
   * Creates the shared file-descriptor shared with the worker-processes
   */
    , _createFd = function () {
        _fd = binding.socket('tcp4');
        binding.bind(_fd, parseInt(this.config.port));
        binding.listen(_fd, 128);
      }

   /**
    * Start the metrics server
    */
    , _doMetricsTracking = function () {
        metrics = metrics || utils.file.requireLocal('metrics');
        this.metricsServer = new metrics.Server(this.config.metricsPort || 9091);
    }

  /**
   * Creates the worker-processes that respond to proxy requests
   */
    , _createWorkerProcesses = function () {
        var self = this
          , configCount = this.config.workers
          , currentCount = this.workerPidList.length
          , needed = configCount - currentCount
          , rotationWindow = this.config.rotationWindow
          , staggerInterval = rotationWindow / needed
          , retirement = (new Date()).getTime() + rotationWindow
          , msg;
        if (needed) {
          msg = 'Creating ' + needed + ' worker process';
          msg += needed > 1 ? 'es.' : '.';
          this.stdoutLog.info(msg);
          while (currentCount < configCount) {
            currentCount++;
            this.createWorkerProcess(retirement);
            retirement -= staggerInterval;
          }
        }
      }

    , _rotateProcesses = function (opts) {
        var self = this
          , options = opts || {}
          , manualRotate = options.manualRotate
          , workers = this.workers
          , worker
          , configCount = this.config.workers
          , now = (new Date()).getTime()
          , heartbeatWindow = this.config.heartbeatWindow
          , killWorker;
        for (var p in workers) {
          worker = workers[p];

          // Graceful retirement, don't kill yet
          if (this.config.rotateWorkers && now > worker.retireAt) {
            killWorker = false;
            worker.retired = true;
            worker.sendMessage({method: 'retire'});
          }

          // Kill if process hasn't called back in a while
          if ((now - worker.heartbeatAt) > heartbeatWindow) {
            killWorker = true;
            this.stdoutLog.warning("No current heartbeat from " + worker.pid + ", killing process.");
          }

          // Kill, manual-rotation from code-changes in dev-mode
          if (manualRotate) {
            killWorker = true;
            this.stdoutLog.warning("Code changed, killing " + worker.pid + ", cycling ...");
          }

          if (killWorker) {
            this.kill(worker.pid);
          }
        }
        if (!shutdownMode) {
          _createWorkerProcesses.call(this);
          // If called manually, not part of the normal polling loop
          if (!manualRotate) {
            setTimeout(function () {
              _rotateProcesses.call(self);
            }, 5000);
          }
        }
      }

    , _useHotCode = function () {
        var self = this
          , dir = process.cwd()
          , callback = function (curr, prev) {
              if (curr.mtime.getTime() != prev.mtime.getTime()) {
                _rotateProcesses.call(self, {manualRotate: true});
              }
            };
        // Watch individual files so we can compare mtimes and restart
        // on code-changes
        utils.file.watch(dir + '/config', callback);
        utils.file.watch(dir + '/lib', callback);
        utils.file.watch(dir + '/app/controllers', callback);
        utils.file.watch(dir + '/app/models', callback);
        utils.file.watch(dir + '/app/views', callback);
      }

    , _initLogging = function (callback) {
        var self = this
          , levelsByType
          , stdoutLevel
          , types = ['stdout', 'stderr', 'access']
          , now = (new Date()).getTime()
          , loggly
          , dir = this.config.logDir
          // Recursive function for rotating and initializing each of the log-types.
          // Calls the passed-in callback when the entire process is done
          , rotateAndInitByType = function () {
              var type = types.shift()
                , cmd
                , next;
              // Grab the next logger-type, if any
              if (type) {
                // Rename the log file, ex.: mv logs/access.log logs/access.<TIMESTAMP>.log
                cmd = 'mv ' + dir + '/' + type + '.log ' + dir + '/' + type + '.' + now + '.log';
                // After the file is renmaed, create the new logger with the original filename
                // e.g., access.log
                next = function () {
                  self[type + 'Log'] = new Log(levelsByType[type], fs.createWriteStream(dir +
                      '/' + type + '.log'), true, loggly);
                  // Go on to the next logger type until none are left
                  rotateAndInitByType();
                };
                childProcess.exec(cmd, next);
              }
              // No logger-types left, continue on with the main init process
              else {
                callback();
              }
            };

        // Set the logging level for stdout
        if (this.config.debug) {
          stdoutLevel = Log.DEBUG;
        }
        else if (this.config.logLevel) {
          stdoutLevel = Log[this.config.logLevel]();
        }
        else {
          stdoutLevel = Log.INFO; // Default to info
        }

        // Now that we have the desired level for stdout, set up log levels by key
        levelsByType = {
          access: 'access'
        , stderr: 'error'
        , stdout: stdoutLevel
        };

        // Create the log directory if it doesn't exist
        childProcess.exec('mkdir -p ' + dir, function (err) {
          if (err) {
            throw err;
          }
        });

        // Kick the log-init process off
        rotateAndInitByType();
      };

  // Public methods
  // -------------
  /**
   * Starts up the proxy server -- creates the shared FD, and the
   * worker-processes
   */
  this.start = function (restart) {
    var self = this
      , msg = restart ? 'restarting' : 'starting';

    _readConfig.call(this);

    if (this.config.metricsPort) {
      _doMetricsTracking.call(self);
    }

    if (!restart) {
      _createFd.call(self);
    }

    _initLogging.call(this, function () {
      self.stdoutLog.info('Server ' + msg + ' with config: ' + JSON.stringify(self.config));
      _rotateProcesses.call(self);
    });

    if (this.config.environment == 'development') {
      _useHotCode.call(this);
    }
  };

  this.restart = function () {
    restartMode = false;
    shutdownMode = false;
    this.start(true);
  };

  this.emergency = function (msg) {
    fs.writeFileSync(this.config.logDir + '/emergency.log', msg);
  };

  this.createWorkerProcess = function (dt) {
    var retireAt = dt || (new Date()).getTime() + this.config.rotationWindow
      , worker = new server.WorkerProcess(retireAt);
    // Pass the shared FD to the worker-processes
    worker.init(_fd);
    // Regsiter the worker-process and record the PID
    this.workers[worker.pid] = worker;
    this.workerPidList.push(worker.pid);
  };


  this.sendShutdownToWorkers = function () {
    var pid
      , pidList = this.workerPidList
      , workers = this.workers
      , worker;
    for (var i = 0, ii = pidList.length; i < ii; i++) {
      pid = pidList[i];
      worker = workers[pid];
      worker.sendMessage({method: 'shutdown'});
    }
  };

  this.shutdown = function (pid) {
    var havePids = false;
    for (var p in this.workers) {
      havePids = true;
    }
    // Once all the child-processes are gone, and no more requests are
    // in-flight, commit seppuku
    if (!havePids) {
      if (!restartMode) {
        this.die("Exiting...");
      }
      this.restart();
    }
  };

  this.kill = function (pid) {
    var pidList = this.workerPidList
      , joined;

    try { process.kill(pid); }
    catch(e) {}

    delete this.workers[pid];

    // Remove from the array of PIDs as well -- look for the actual PID
    // value, not just array-position
    joined = ',' + pidList.join(',') + ',';
    joined = joined.replace(',' + pid + ',', ',');
    joined = utils.string.trim(joined, ',');

    this.workerPidList = joined.length ? joined.split(',') : [];
  };

  /**
   * Prints out a message and ends the program.
   * @param {String} str The message to print out before dying.
   */
  this.die = function (str) {
    console.log(str);
    process.exit();
  };

}();

/**
 * @constructor Worker-process that handles proxy requests
 */
server.WorkerProcess = function (retireAt) {
  this.retireAt = retireAt;
  this.heartbeatAt = (new Date()).getTime();
  this.process = null;
  this.pid = null;
  this.fd = null;
  this.retired = false;
  this.messageParser = null;

  // Create a pair of sockets that the master process and the
  // child will use to communicate
  // http://osr507doc.sco.com/en/netguide/dusockD.socketpairs_codetext.html
  // Credits: Ext's Connect, http://github.com/extjs/Connect
  var fds = binding.socketpair();

  // Spawn the child process
  this.process = childProcess.spawn(
    eval(server.config.worker_executable) || process.execPath,
        [__dirname+ '/geddy.js'], {customFds: [fds[1], -1, -1]}
  );
  this.pid = this.process.pid;

  var self = this;
  // Wait a moment, then patch child's stdin
  if (!self.process.stdin) {
    self.process.stdin = new net.Stream(fds[0], 'unix');
  }
}

server.WorkerProcess.prototype = new function () {
  var _dispatch = {
        retired: function (msg) {
          this.commitSeppuku(true, 'retiring');
        }
      , shutdown: function (msg) {
      console.log("IN SHUTDOWN - SERVER");
          this.commitSeppuku(false, 'shutting down');
          server.shutdown();
        }
      , log: function (msg) {
          // If for some reason, there's no logType, assume debug?
          var type = msg.logType || 'debug'
          // access/error have their own loggers, everything else
          // goes to stdoutLog
            , logger = server[type + 'Log'] || server.stdoutLog;
          logger[type](msg.message);
        }
      , heartbeat: function (msg) {
          this.heartbeatAt = (new Date()).getTime();
        }
      , createMetric: function (msg) {
          if (server.metricsServer) {
            msg.type = msg.type[0].toUpperCase() + msg.type.substring(1)
            server.metricsServer.addMetric(msg.eventType, new metrics[msg.type]);
          }
       }
      , updateMetric: function (msg) {
        if (server.metricsServer) {
          var namespaces = msg.eventType.split('.')
            , event = namespaces.pop()
            , namespace = namespaces.join('.');
          var metric = server.metricsServer.trackedMetrics[namespace][event];
          metric[msg.metricMethod].apply(metric, msg.metricArgs);
        }
      }
      , error: function (msg) {
        server.stderrLog.error('Caught error-message from child-process.');
        server.stderrLog.error(msg.data.stack);
        this.commitSeppuku(false, 'killing');
      }
   };

   this.commitSeppuku = function (respectShutdown, msg) {
     if (respectShutdown && shutdownMode) {
       return;
     }
     var child = this.process;
     server.stdoutLog.warning(msg + ' ' + child.pid);
     server.kill(child.pid);
   };

  /**
   * @param {Number} fd pointer to the shared file descriptor
   * to pass to the HTTP server in the worker-process
   */
  this.init = function (fd) {
    // Pass a dummy config and fd via the child's stdin
    this.fd = fd;
    var msg = {
      method: 'config'
    , data: server.config
    };
    this.messageParser = new utils.MessageParser(_dispatch, this, function (notParsed) {
      process.stdout.write(notParsed + '\n');
    });
    this.sendMessage(msg);
    this.addListeners();
  };

  this.addListeners = function () {
    var self = this
      , child = this.process;

    child.stdout.addListener('data', function (d) {
      self.receiveMessage(d);
    });

    child.stderr.addListener('data', function (d) {
      var data = d.toString();
      if (data.indexOf('###shutdown###') > -1) {
        process.kill(child.pid);
        process.exit();
      }
      else {
        process.stdout.write(data);
      }
    });

    child.addListener('exit', function (code) {
      self.fixBrokenWorker();
    });

  };

  this.fixBrokenWorker = function () {
     if (!this.retired) {
       server.stdoutLog.warning("Worker " + this.pid + " died without being retired.");
       server.kill(this.pid);
     }
  };

  this.receiveMessage = function (d) {
    this.messageParser.handle(d);
  };

  this.sendMessage = function (msg) {
    try {
      var output = JSON.stringify(msg);
      this.process.stdin.write(output + '\n', 'ascii', this.fd);
    } catch (err) {
      this.fixBrokenWorker();
    }
  };

}();
