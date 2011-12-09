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

  this.shutdown = function (msg) {
    var self = this
      , startTime = (new Date()).getTime()
      , ready = false;
    this.server.addListener('close', function () {
      // Poll to see until all in-flight requests complete or
      // we pass the graceful-shutdown timeout window
      setInterval(function () {
        if (geddy.inFlight.getCount()) {
          ready = (new Date()).getTime() - start >
              self.config.gracefulShutdownTimeout;
          if (ready) {
            // Unceremoniously end any outstanding responses
            // FIXME: What shoud the statusCode be on these?
            geddy.inFlight.each(function (entry) {
              entry.resp.end();
            });
          }
        }
        else {
          ready = true;
        }
        if (ready) {
          self.sendMessage({
            workerId: process.pid
          , method: 'readyForShutdown'
          });
        }
      }, 2000);
    });
    this.server.close();
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
