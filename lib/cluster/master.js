var Master
  , cluster
  , exec = require('child_process').exec
  , fs = require('fs')
  , utils = require('../utils')
  , watchFiles = require('../watch_files')
  , Log = require('../../deps/log')
  , dispatch = require('./master_dispatch');

if (!geddy.FD_HACK) {
  cluster = require('cluster');
}

var processModes = {
  KEEP_ALIVE: 'keepAlive'
, SHUTDOWN: 'shutdown'
, WATCH_FILES: 'watchFiles'
};

Master = function () {
  this.init();
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
        if (this.config.environment == 'development') {
          this.config.workers = 1;
          this.processMode = processModes.WATCH_FILES;
        }

        // App configs
        appBaseConfig = require(dir + '/config/environment');
        appEnvConfig = require(dir + '/config/' + this.config.environment);

        // Start with a blank slate, mix everything in
        utils.mixin(this.config, appBaseConfig);
        utils.mixin(this.config, appEnvConfig);
        utils.mixin(this.config, opts);

        next();
      }

    , _initLogging = function (next) {
        var self = this
          , callback
          , levelsByType
          , stdoutLevel
          , types = ['stdout', 'stderr', 'access']
          , now = (new Date()).getTime()
          , loggly
          , dir = this.config.logDir
          , rotateAndInitByType;

        callback = function () {
        };

        // Recursive function for rotating and initializing each of the log-types.
        // Calls the passed-in callback when the entire process is done
        rotateAndInitByType = function () {
          var type = types.shift()
            , cmd
            , nextLog;
          // Grab the next logger-type, if any
          if (type) {
            // Rename the log file, ex.: mv logs/access.log logs/access.<TIMESTAMP>.log
            cmd = 'mv ' + dir + '/' + type + '.log ' + dir + '/' + type + '.' + now + '.log';
            // After the file is renmaed, create the new logger with the original filename
            // e.g., access.log
            nextLog = function () {
              self[type + 'Log'] = new Log(levelsByType[type], fs.createWriteStream(dir +
                  '/' + type + '.log'), true, loggly);
              // Go on to the next logger type until none are left
              rotateAndInitByType();
            };
            exec(cmd, nextLog);
          }
          // No logger-types left, continue on with the main init process
          else {
            self.stdoutLog.info('Server starting with config: ' +
                JSON.stringify(self.config, true, 2));
            next();
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
        exec('mkdir -p ' + dir, function (err) {
          if (err) {
            throw err;
          }
        });

        // Kick the log-init process off
        rotateAndInitByType();
      }

    , _monitorProcesses = function (next) {
        var self = this
          , workers = this.workers
          , count = this.config.workers
          , now = (new Date()).getTime()
          , heartbeatWindow = this.config.heartbeatWindow
          , killWorker;

        workers.each(function (data) {
          var worker = data.worker;

          // Kill if process hasn't called back in a while
          if ((now - worker.heartbeatAt) > heartbeatWindow) {
            killWorker = true;
            self.stdoutLog.warning("No current heartbeat from " +
                worker.pid + ", killing process.");
          }

          // Kill, manual-restart from code-changes in dev-mode
          if (self.processMode == processModes.WATCH_FILES) {
            killWorker = true;
            self.stdoutLog.warning("Code changed, killing " +
                worker.pid + ", cycling ...");
          }

          if (killWorker) {
            self.kill(worker.pid);
          }

        });

        if (this.processMode != processModes.SHUTDOWN) {
          this.createWorkers();;
          // If called manually, not part of the normal polling loop
          if (this.processMode == processModes.KEEP_ALIVE) {
            setTimeout(function () {
              _monitorProcesses.call(self);
            }, 5000);
          }
        }

        // Initial async-chain invocation during startup
        if (typeof next == 'function') {
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
    this.opts = null;
    this.config = {};
    this.workers = new geddy.SortedCollection();
    this.processMode = processModes.KEEP_ALIVE;
  };

  this.start = function (options) {
    var self = this
      , items
      , chain;

    this.opts = options || {};

    items = [
      _readConfig
    , _initLogging
    , _monitorProcesses
    ];

    chain = new geddy.async.SimpleAsyncChain(items, this);
    chain.last = function () {
      if (self.config.environment == 'development') {
        _watchFiles.call(self);
      }
    };
    chain.run();
  };

  this.createWorkers = function () {
    var configCount = this.config.workers
      , currentCount = this.workers.count
      , needed = configCount - currentCount
      , msg;
    if (needed) {
      msg = 'Creating ' + needed + ' worker process';
      msg += needed > 1 ? 'es.' : '.';
      this.stdoutLog.info(msg);
      while (currentCount < configCount) {
        currentCount++;
        this.createWorker();
      }
    }
  };

  this.createWorker = function () {
    var w = cluster.fork()
      , data = new WorkerData(w)
      , id = w.pid.toString();
    this.workers.addItem(id, data);
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
      this.fixBrokenWorker(workerId);
    }
  };

  this.receiveMessage = function (msg) {
    console.log('received in parent: ' + JSON.stringify(msg));
    if (msg && msg.method && dispatch[msg.method]) {
      dispatch[msg.method].call(this, msg);
    }
  };

  this.killWorker = function (pid) {
    try { process.kill(pid); }
    catch(e) {}

    this.workers.removeItem(pid.toString());
  };

  this.fixBrokenWorker = function () {
    console.log('fixBrokenWorker called');
  };

})();

WorkerData = function (worker) {
  this.heartbeatAt = (new Date()).getTime();
  this.process = null;
  this.pid = null;
  this.worker = worker;
};

module.exports.Master = Master;
module.exports.WorkerData = WorkerData;
