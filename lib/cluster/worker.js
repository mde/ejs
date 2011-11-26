var http = require('http')
  , Worker;

Worker = function () {
  this.init();
};

Worker.prototype = new (function () {
  this.init = function () {
    this.config = {};
    this.server = null;

    this.addListeners();
    this.createServer();

    this.start();
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
    this.server.listen('4000');
  };

  this.configure = function (config) {
    this.config = config;
  };

  this.sendMessage = function (msg) {
    process.send(msg);
  };

  this.receiveMessage = function (msg) {
    console.log('received in child: ' + JSON.stringify(msg));
  };

})();

module.exports.Worker = Worker;
