var fs = require('fs')
  , utils = require('utilities')
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
      self.createServer();
      self.startHeartbeat();
      afterConfigure();
    };

    this.config = {};
    this.server = null;
    this.log = new Logger(this);

    this.addListeners();
  };

  this.addListeners = function () {
    var self = this;
    process.addListener('message', function (data) {
      self.receiveMessage(data);
    });
  };

  this.createServer = function () {
    var ssl = this.config.ssl
      , spdy = this.config.spdy;

    if (ssl) {
      if (ssl.cert && ssl.key) {
        if(spdy) {
          this.server = utils.file.requireLocal('spdy');
        } else {
          this.server = require('https');
        }

        this.server = this.server.createServer({
            key: fs.readFileSync(ssl.key)
          , cert: fs.readFileSync(ssl.cert)
        });
      }
      else {
        this.log.error('Cannot start server using SSL.' +
            'Missing certificate or private key.');
      }
    }
    else {
      this.server = require('http').createServer();
    }
  };

  this.startServer = function () {
    if (this.config) {
      var hostname = this.config.hostname || null
        , ssl = this.config.ssl ? ' (SSL)' : ''
        , spdy = this.config.spdy ? '(SPDY)' : '';

      this.server.listen(parseInt(this.config.port, 10), hostname);

      this.log.info('Server worker running in ' + this.config.environment +
        ' on port ' + this.config.port + ssl + spdy + ' with a PID of: ' + process.pid);
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
    var self = this;
    this.shutDownCleanly(this.rotationTimeout, function () {
      self.sendMessage({
        workerId: process.pid
      , method: 'readyForRetirement'
      });
    });
  };

  this.shutdown = function (msg) {
    var self = this;
    this.shutDownCleanly(this.gracefulShutdownTimeout, function () {
      self.sendMessage({
        workerId: process.pid
      , method: 'readyForShutdown'
      });
    });
  };

  this.shutDownCleanly = function (timeout, callback) {
    var self = this
      , startTime = (new Date()).getTime()
      , ready = false;
    this.server.addListener('close', function () {
      // Poll to see until all in-flight requests complete or
      // we pass the timeout window
      setInterval(function () {
        var count = geddy.inFlight.getCount();
        if (count) {
          ready = (new Date()).getTime() - startTime > timeout;
          if (ready) {
            // Unceremoniously end responses in the in-flight registry
            geddy.inFlight.each(function (entry) {
              try {
                if (entry.response) {
                  entry.response.end();
                }
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
          callback();
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
