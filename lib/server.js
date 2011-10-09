
var VERSION = '0.1.0'
  , RETIREMENT_WINDOW = 5 * 60 * 1000
  , ROTATION_WINDOW = 2 * 60 * 60 * 1000
  , binding = process.binding('net')
  , net = require('net')
  , childProcess = require('child_process')
  , vm = require('vm')
  , fs = require('fs')
  , Log = require('./log')
  , metrics
  , util = require('./utils')
  , Parser
  , optsReg
  , parsed
  , opts
  , pids = ''
  , shutdownMode = false
  , restartMode = false;

try {
  metrics = require('metrics');
}
catch(e) {}

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
  , port: 9090
  // Set stdout to debug log-level
  , debug: false
  // Use worker-process rotation
  , rotateWorkers: true
  // How long for a full rotation
  , rotationWindow: 2 * 60 * 60 * 1000
  // Default logfile location
  , logDir: process.cwd() + '/logs'
  // How long to wait for in-flight requests before killing
  , gracefulRestartTimeout: 60000
  // Number of milliseconds old a heartbeat-timestamp can be
  // before killing the worker process
  , heartbeatWindow: 20000
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
        // TODO: make server configs reload on graceful restart?
          , baseConfig = require(dir + '/config/environment.js')
          , envConfig;

        this.config.environment = opts.environment || this.config.environment;
        envConfig = require(dir + '/config/' + opts.environment + '.js');

        // Start with a blank slate, mix everything in
        // TODO: Do in one go with recursive mixin
        util.mixin(this.config, baseConfig);
        util.mixin(this.config, envConfig);
        util.mixin(this.config, opts);
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
        if (metrics) {
          this.metricsServer = new metrics.Server(this.config.metricsPort || 9091);
        }
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

    , _doProcessAccounting = function () {
        var self = this
          , workers = this.workers
          , worker
          , configCount = this.config.workers
          , now = (new Date()).getTime()
          , heartbeatWindow = this.config.heartbeatWindow;
        for (var p in workers) {
          worker = workers[p];
          if (this.config.rotateWorkers && now > worker.retireAt) {
            worker.retired = true;
            worker.sendMessage({method: 'retire'});
          }
          if ((now - worker.heartbeatAt) > heartbeatWindow) {
            this.stdoutLog.warning("No current heartbeat from " + worker.pid + ", killing process.");
            this.kill(worker.pid);
          }
        }
        if (!shutdownMode) {
          _createWorkerProcesses.call(this);
          setTimeout(function () {
            _doProcessAccounting.call(self);
          }, 5000);
        }
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
      _doProcessAccounting.call(self);
    });
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
      , index;

    try { process.kill(pid); }
    catch(e) {}

    delete this.workers[pid];
    for (var i = 0, ii = pidList.length; i < ii; i++) {
      if (pidList[i] == pid) {
        index = i;
      }
    }
    this.workerPidList.splice(index, 1);
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
    //eval(server.config.worker_arguments) || [process.cwd() + '/app.js'],
    [__dirname+ '/app_runner.js'],
    {customFds: [fds[1], -1, -1]}
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
    this.messageParser = new util.MessageParser(_dispatch, this, function (notParsed) {
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
