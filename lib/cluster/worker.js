var http = require('http')
  , dispatch = require('./worker_dispatch')
  , Logger = require('./worker_logger').Logger
  , Worker;

Worker = function () {
  var self = this;
};

Worker.prototype = new (function () {
  this.init = function (afterConfigure) {
    var self = this;

    this._afterConfigure = function () {
      self.startHeartbeat();
      afterConfigure();
    };

    this.config = {};
    this.server = null;
    this.log = new Logger(this);

    this.addListeners();
    this.createServer();
  };

  this.addListeners = function () {
    var self = this;
    process.addListener('message', function (data) {
      self.receiveMessage(data);
    });
  };

  this.createServer = function () {
    this.server = http.createServer();
  };

  this.startServer = function () {
    if (this.config) {
      this.server.listen(parseInt(this.config.port, 10));
      this.log.info('Server worker running in ' + this.config.environment +
          ' on port ' + this.config.port + ' with a PID of: ' + process.pid);
      this.log.debug('LOGGING STARTED ============================================');
      this.log.debug('============================================================');
    }
    else {
      this.log.error('Cannot start server without config.');
    }
  };

  this.configure = function (config) {
    this.config = config;
    this._afterConfigure();
  };

  this.sendMessage = function (msg) {
    process.send(msg);
  };

  this.receiveMessage = function (msg) {
    if (msg && msg.method && dispatch[msg.method]) {
      dispatch[msg.method].call(this, msg);
    }
  };

  this.retire = function (msg) {
    this.shutDownCleanly('Retirement');
  };

  this.shutdown = function (msg) {
    this.shutDownCleanly('Shutdown');
  };

  this.shutDownCleanly = function (type) {
    var self = this
      , startTime = (new Date()).getTime()
      , ready = false;
    this.server.addListener('close', function () {
      // Poll to see until all in-flight requests complete or
      // we pass the graceful-shutdown timeout window
      setInterval(function () {
        var count = geddy.inFlight.getCount();
        if (count) {
          ready = (new Date()).getTime() - startTime >
              self.config.gracefulShutdownTimeout;
          if (ready) {
            // Unceremoniously end any outstanding responses
            // FIXME: What shoud the statusCode be on these?
            geddy.inFlight.each(function (entry) {
              try {
                entry.response.end();
              }
              // Squelch, the process is going down anyhow
              catch(e) {}
            });
          }
        }
        else {
          ready = true;
        }
        if (ready) {
          self.sendMessage({
            workerId: process.pid
          , method: 'readyFor' + type
          });
        }
      }, 2000);
    });
    try {
      // Squelch this too, the process is going down anyhow
      this.server.close();
    }
    catch(e) {} // Squelch this too
  };

  this.startHeartbeat = function () {
    var self = this;
    setInterval(function () {
      self.sendMessage({
        workerId: process.pid.toString()
      , method: 'heartbeat'
      });
    }, self.config.heartbeatInterval);
  };

})();

module.exports.Worker = Worker;
