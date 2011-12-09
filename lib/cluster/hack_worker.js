var WorkerBase = require('./worker').Worker
  , Worker
  , http = require('http')
  , net = require('net')
  , Logger = require('./worker_logger').Logger
  , MessageParser = require('./hack_message_parser').MessageParser;

Worker = function () {
  var self = this;
  this._fd = null;
  this._parser = new MessageParser(function (msg) {
    self.receiveMessage(msg);
  });
}

// Inherit from normal Worker
Worker.prototype = geddy.mixin({}, WorkerBase.prototype);
// Overrides
geddy.mixin(Worker.prototype, new (function () {
  this.init = function (afterConfigure) {
    var self = this;

    this._afterConfigure = function () {
      self.startHeartbeat();
      afterConfigure();
    };

    this.config = {};
    this.server = null;
    this.log = new Logger(this);
    // This process listens on stdin to communicate with the parent.
    this.stdin = new net.Stream(0, 'unix');

    this.addListeners();
    this.createServer();

    // Fire up stdin to receive the shared FD
    this.stdin.resume();
  };

  this.addListeners = function () {
    var self = this;

    // Listen on the passed-in shared FD and open it
    this.stdin.addListener('fd', function (fd) {
      // Setup our server process
      //self.start(fd);
      self._fd = fd;
    });

    this.stdin.addListener('data', function (data) {
      self._parser.parse(data.toString());
    });
  };

  this.startServer = function (fd) {
    if (this._fd && this.config) {
      this.server.listenFD(this._fd, 'tcp4');
      this.log.info('Server worker running in ' + this.config.environment +
          ' on port ' + this.config.port + ' with a PID of: ' + process.pid);
      this.log.debug('LOGGING STARTED ============================================');
      this.log.debug('============================================================');
    }
    else {
      this.log.error('Cannot start server without config.');
    }
  };

  this.sendMessage = function (msg) {
    var output = JSON.stringify(msg);
    process.stdout.write(output + '\n');
  };

})());

module.exports.Worker = Worker;

