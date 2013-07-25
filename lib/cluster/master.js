var Master
  , cluster = require('cluster')
  , fs = require('fs')
  , path = require('path')
  , Log = require('../../deps/log')
  , dispatch = require('./master_dispatch')
  , config = require('../config')
  , utils = require('utilities')
  , file = utils.file
  , date = utils.date;

var processModes = {
  KEEP_ALIVE: 'keepAlive'
, SHUTDOWN: 'shutdown'
, WATCH_FILES: 'watchFiles'
};

Master = function () {
  var self = this
    , handleExit = function (worker) {
        // Node 0.8 vs. 0.6
        var proc = worker.process || worker
          , id = proc.pid.toString();
        self.handleWorkerExit(id);
      };
  this.init();
  // Node 0.6
  cluster.addListener('death', handleExit);
  // Node 0.8
  cluster.addListener('exit', handleExit);
};

Master.prototype = new (function () {

  var _readConfig = function (next) {
        this.config = config.readConfig(this.opts);
        if (this.config.environment == 'development') {
          this.processMode = processModes.WATCH_FILES;
        }
        next();
      }

    , _initLogging = function (next) {
        var self = this
          , types = ['stdout', 'stderr', 'access']
          , now = date.strftime(new Date(), '%FT%T')
          , dir = this.config.logDir
          , levelsByType = {access: 'access', stderr: 'error', stdout: 0}
          , writing = dir != null
          , printSync = this.config.environment == 'development'
          , rotateAndInitByType;

        // Colon is not valid filepath char in Win
        // Use percent, that seems to be hunky-dory
        if (process.platform == 'win32') {
          now = now.replace(/:/g, '%');
        }

        // Set stdout log level
        if (this.config.debug) {
          levelsByType.stdout = Log.DEBUG;
        }
        else if (this.config.logLevel) {
          // If a custom log level is given, then
          // get the level from Log
          levelsByType.stdout = Log[this.config.logLevel];
        }
        else {
          // Default to info
          levelsByType.stdout = Log.INFO;
        }

        // If we are writing, then attempt to create the directory
        // if it doesn't exist
        if (writing) {
          file.mkdirP(dir);
        }

        types.forEach(function (type) {
          var currentLog = path.join(dir, type + '.log')
            , archivedLog = path.join(dir, type + '.' + now + '.log');

          // If the main log file exists, then rename it to the archived log file
          if (writing && file.existsSync(currentLog)) {
            try {
              fs.renameSync(currentLog, archivedLog);
            }
            // renameSync doesn't work correctly here for some reason,
            // fall back to copy/delete
            catch (e) {
              file.cpR(currentLog, archivedLog);
              fs.unlinkSync(currentLog);
            }
          }

          // Create a new logger for the type and give it a name on this with appended 'Log'
          // e.g., stdoutLog
          if (writing) {
            self[type + 'Log'] = new Log(levelsByType[type],
              fs.createWriteStream(currentLog), printSync);
          }
          else {
            self[type + 'Log'] = new Log(levelsByType[type], null, printSync);
          }

          self[type + 'Log'].type = type;
        });

        this.stdoutLog.info('Server starting with config: ' +
            JSON.stringify(self.config, true, 2));
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
                if (now > (data.retireAt + self.config.rotationTimeout + 5000)) {
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
              self.stdoutLog.info('Code changed, killing ' +
                  worker.process.pid + ', cycling ...');
            }
          }

          if (killWorker) {
            self.killWorker(worker.process.pid);
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
          , callback = function (file) {
              _monitorProcesses.call(self, {manualRotate: true});
            };
        // Watch individual files so we can compare mtimes and restart
        // on code-changes
        file.watch(dir + '/config', callback);
        file.watch(dir + '/lib', callback);
        file.watch(dir + '/app/controllers', callback);
        file.watch(dir + '/app/models', callback);
        file.watch(dir + '/app/views', callback);
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
      , gr
      , items
      , chain;

    this.opts = options || {};

    if (this.opts.geddyRoot) {
      gr = utils.file.absolutize(this.opts.geddyRoot);
      if (!fs.existsSync(gr)) {
        throw new Error('geddy-root directory ' + gr + ' does not exist.');
      }
      process.chdir(gr);
    }

    // Search for 'config' directory in parent directories
    utils.file.searchParentPath('config', function (err, filePath) {
      if (err) {
        console.log('Geddy needs an app to run. See "geddy -h" for help.');
        process.exit();
      }

      items = [
        _readConfig
      , _initLogging
      , _monitorProcesses
      ];

      chain = new geddy.async.SimpleAsyncChain(items, self);
      chain.last = function () {
        // Watchfiles is apparently still broken in win32
        if (self.config.environment == 'development' &&
            process.platform != 'win32') {
          _watchFiles.call(self);
        }
      };
      chain.run();

    });

  };

  this.createWorkers = function () {
    var configCount = this.config.workers
      , currentCount = this.workers.count
      , needed
      , rotationWindow = this.config.rotationWindow
      , staggerInterval = rotationWindow / needed
      , retirement = (new Date()).getTime() + rotationWindow
      , msg;

    if (this.processMode == processModes.WATCH_FILES) {
      currentCount = 0;
    }
    needed = configCount - currentCount

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
      // Node 0.8 vs. 0.6
      , proc = w.process || w
      , id = proc.pid.toString()
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
    if (!pid) {
      return;
    }
    var self = this
      , id = pid.toString()
      , worker = this.workers.getItem(id);
    worker.killed = true;
    //try {
      process.kill(pid);
    //}
    //catch (e) {}
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
