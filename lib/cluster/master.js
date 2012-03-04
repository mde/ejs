var Master
  , cluster
  , fs = require('fs')
  , path = require('path')
  , watchFiles = require('../watch_files')
  , Log = require('../../deps/log')
  , dispatch = require('./master_dispatch')
  , fileUtils = require('../utils/file')
  , dateUtils = require('../utils/date').date;

if (!geddy.FD_HACK) {
  cluster = require('cluster');
}

var processModes = {
  KEEP_ALIVE: 'keepAlive'
, SHUTDOWN: 'shutdown'
, WATCH_FILES: 'watchFiles'
};

Master = function () {
  var self = this;
  this.init();
  // Clustering-only
  cluster.addListener('death', function (worker) {
    var id = worker.pid.toString();
    self.handleWorkerExit(id);
  });
};

Master.prototype = new (function () {

  var _readConfig = function (next) {
        var opts = this.opts
          , dir = process.cwd()
          , appBaseConfig
          , appEnvConfig;

        this.config = require('../base_config');
        this.config.environment = opts.environment || this.config.environment;

        // Base config for workers-count should be 1 in dev-mode
        // Cycle based on filesystem changes, not keep-alive
        // Process-rotation not possible in this mode
        if (this.config.environment == 'development') {
          this.config.workers = 1;
          this.processMode = processModes.WATCH_FILES;
          this.config.rotateWorkers = false;
        }

        // App configs
        appBaseConfig = require(dir + '/config/environment');
        appEnvConfig = require(dir + '/config/' + this.config.environment);

        // Start with a blank slate, mix everything in
        geddy.mixin(this.config, appBaseConfig);
        geddy.mixin(this.config, appEnvConfig);
        geddy.mixin(this.config, opts);

        // Obvious, don't rotate with only one worker
        if (this.config.workers < 2) {
          this.config.rotateWorkers = false;
        }

        next();
      }

    , _initLogging = function (next) {
        var self = this
          , levelsByType
          , stdoutLevel
          , types = ['stdout', 'stderr', 'access']
          , now = dateUtils.strftime(new Date(), '%FT%T')
          , loggly
          , dir = this.config.logDir
          , rotateAndInitByType;

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
        fileUtils.mkdirP(dir);

        types.forEach(function (type) {
          var currentLog = path.join(dir, type + '.log')
            , archivedLog = path.join(dir, type + '.' + now + '.log');
          if (path.existsSync(currentLog)) {
            try {
              fs.renameSync(currentLog, archivedLog);
            }
            catch(e) {
              fileUtils.cpR(currentLog, archivedLog);
              fs.unlinkSync(currentLog);
            }
          }
          // After the file is renmaed, create the new logger with the original filename
          // e.g., access.log
          self[type + 'Log'] = new Log(levelsByType[type],
              fs.createWriteStream(dir +
              '/' + type + '.log'), true, loggly);
          self[type + 'Log'].type = type;
        });
        this.stdoutLog.info('Server starting with config: ' +
            JSON.stringify(self.config, true, 2));
        next();
      }

    , _startMetrics = function (next) {
        var metrics
          , port;
        if (this.config.metrics) {
          try {
            port = this.config.metrics.port;
            metrics = require(process.cwd() + '/node_modules/metrics');
            this.stdoutLog.info('Metrics server started on port ' + port);
            this.metricsServer = new metrics.Server(port);
          }
          catch(e) {
            throw new Error('To turn on Metrics, do `npm install metrics`. ' +
                'Could not find it at: ' + process.cwd() + '/node_modules/metrics');
          }
        }
        next();
      }
    , _monitorProcesses = function (next) {

        // Stop spawning new worker-processes when shutting down
        if (this.processMode == processModes.SHUTDOWN) {
          return;
        }

        var self = this
          , workers = this.workers
          , count = this.config.workers
          , now = (new Date()).getTime()
          , heartbeatWindow = this.config.heartbeatWindow;

        workers.each(function (data, id) {
          var worker = data.worker
            , killWorker = false;

          // Process-rotation fu
          if (self.config.rotateWorkers) {
            // If the process takes too long to retire, just kill it
            if (data.retired) {
              if (!data.killed) {
                self.stderrLog.warning('Process ' +
                    worker.pid + ' took too long to retire, killing process.');
                if (now > (data.retireAt + self.config.rotationTimeout + 5000)){
                  killWorker = true;
                }
              }
            }
            else {
              // If this worker is past its freshness date, retire it
              if (now > data.retireAt) {
                self.stdoutLog.info('Rotating ' +
                    worker.pid + ', killing process.');
                data.retired = true;
                self.sendMessage(id, {
                  method: 'retire'
                });
              }
            }
          }

          // Kill if process hasn't called back in a while
          if ((now - worker.heartbeatAt) > heartbeatWindow) {
            if (!data.killed) {
              killWorker = true;
              self.stderrLog.warning('No current heartbeat from ' +
                  worker.pid + ', killing process.');
            }
          }

          // Kill, manual-restart from code-changes in dev-mode
          if (self.processMode == processModes.WATCH_FILES) {
            if (!data.killed) {
              killWorker = true;
              self.stderrLog.warning('Code changed, killing ' +
                  worker.pid + ', cycling ...');
            }
          }

          if (killWorker) {
            self.killWorker(worker.pid);
          }
        });

        this.createWorkers();;
        // If called manually, not part of the normal polling loop
        if (this.processMode == processModes.KEEP_ALIVE) {
          setTimeout(function () {
            _monitorProcesses.call(self);
          }, 5000);
        }

        // Initial async-chain invocation during startup
        if (typeof next === 'function') {
          next();
        }
      }

    , _watchFiles = function () {
        var self = this
          , dir = process.cwd()
          , callback = function (curr, prev) {
              if (curr.mtime.getTime() != prev.mtime.getTime()) {
                _monitorProcesses.call(self, {manualRotate: true});
              }
            };
        // Watch individual files so we can compare mtimes and restart
        // on code-changes
        watchFiles.watch(dir + '/config', callback);
        watchFiles.watch(dir + '/lib', callback);
        watchFiles.watch(dir + '/app/controllers', callback);
        watchFiles.watch(dir + '/app/models', callback);
        watchFiles.watch(dir + '/app/views', callback);
      };

  this.init = function () {
    var self = this;
    this.opts = null;
    this.config = {};
    this.workers = new geddy.SortedCollection();
    this.processMode = processModes.KEEP_ALIVE;
    // Don't bother with graceful shutdown for win32
    if (!process.platform == 'win32') {
      process.addListener('SIGTERM', function () {
        self.startShutdown();
      });
    }
  };

  this.start = function (options) {
    var self = this
      , items
      , chain;

    this.opts = options || {};

    items = [
      _readConfig
    , _initLogging
    , _startMetrics
    , _monitorProcesses
    ];

    chain = new geddy.async.SimpleAsyncChain(items, this);
    chain.last = function () {
      // Watchfiles is apparently still broken in win32
      if (self.config.environment == 'development' &&
          process.platform != 'win32') {
        _watchFiles.call(self);
      }
    };
    chain.run();
  };

  this.createWorkers = function () {
    var configCount = this.config.workers
      , currentCount = this.workers.count
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
        this.createWorker(retirement);
        retirement -= staggerInterval;
      }
    }
  };

  this.createWorker = function (dt) {
    var self = this
      , retireAt = dt || (new Date()).getTime() + this.config.rotationWindow
      , w = cluster.fork()
      , id = w.pid.toString()
      , data = new WorkerData(id, w);
    this.workers.addItem(id, data, retireAt);
    this.addWorkerListeners(w);
    this.sendMessage(id, {
      method: 'config'
    , data: this.config
    });
  };

  this.addWorkerListeners = function (worker) {
    var self = this;
    worker.addListener('message', function (msg) {
      self.receiveMessage(msg);
    });
  };

  this.sendMessage = function (workerId, msg) {
    var id = workerId.toString()
      , worker = this.workers.getItem(id).worker;
    try {
      worker.send(msg);
    }
    catch (err) {
      this.killWorker(workerId);
    }
  };

  this.receiveMessage = function (msg) {
    if (msg && msg.method && dispatch[msg.method]) {
      dispatch[msg.method].call(this, msg);
    }
    else {
      if (!msg.cmd) {
        console.log(JSON.stringify(msg));
      }
    }
  };

  this.killWorker = function (pid) {
    var self = this
      , id = pid.toString()
      , worker = this.workers.getItem(id);
    worker.killed = true;
    try {
      process.kill(pid);
    }
    catch(e) {}
    // handleWorkerExit gets called on the process die/exit event.
    // If for some reason it doesn't get called, we still want
    // the process removed from the list of active proceses
    setTimeout(function () {
      self.handleWorkerExit(pid);
    }, 20000);
  };

  this.handleWorkerExit = function (pid) {
    var id = pid.toString()
      , worker = this.workers.getItem(id);
    if (worker && !worker.killed) {
      this.stderrLog.error('Worker ' + id + ' died.');
    }
    this.workers.removeItem(id);
    // As each worker exits, check to see if all processes
    // have exited and we can kill the master process
    if (this.processMode == processModes.SHUTDOWN) {
      this.checkShutdown();
    }
  };

  this.startShutdown = function () {
    var self = this;
    this.processMode = processModes.SHUTDOWN;
    this.stdoutLog.notice('Graceful shutdown from SIGTERM...');
    this.workers.each(function (data) {
      self.sendMessage(data.id, {
        method: 'shutdown'
      });
    });
  };

  this.checkShutdown = function () {
    if (!this.workers.count) {
      this.shutDown();
    }
  };

  this.shutDown = function () {
    process.exit();
  };

})();

WorkerData = function (id, worker, retireAt) {
  this.id = id;
  this.heartbeatAt = (new Date()).getTime();
  this.process = null;
  this.pid = null;
  this.worker = worker;
  this.retireAt = retireAt;
  this.retired = false;
  this.killed = false;
};

module.exports.Master = Master;
module.exports.WorkerData = WorkerData;
