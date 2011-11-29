var http = require('http')
  , dispatch = require('./worker_dispatch')
  , Logger = require('./worker_logger').Logger
  , Worker;

Worker = function () {
  this.init();
};

Worker.prototype = new (function () {
  this.init = function () {
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

  this.start = function () {
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
  };

  this.sendMessage = function (msg) {
    process.send(msg);
  };

  this.receiveMessage = function (msg) {
    if (msg && msg.method && dispatch[msg.method]) {
      dispatch[msg.method].call(this, msg);
    }
  };

})();

module.exports.Worker = Worker;
