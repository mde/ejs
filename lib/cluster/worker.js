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

    //this.start();
  };

  this.addListeners = function () {
    var self = this;
    process.addListener('message', function (data) {
      self.receiveMessage(data);
    });
  };

  this.createServer = function () {
    this.server = http.Server(function(req, res) {
      res.writeHead(200);
      res.end("hello world\n");
    });
  };

  this.start = function () {
    this.server.listen(parseInt(this.config.port, 10));
    this.log.info('Worker running server on port ' + this.config.port);
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
