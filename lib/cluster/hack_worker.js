var WorkerBase = require('./worker').Worker
  , Worker
  , http = require('http')
  , net = require('net')
  , utils = require('../utils')
  , MessageParser = require('./hack_message_parser').MessageParser;

Worker = function () {
  var self = this;
  this._parser = new MessageParser(function (msg) {
    self.receiveMessage(msg);
  });
  this.init();
}

// Inherit from normal Worker
Worker.prototype = geddy.mixin({}, WorkerBase.prototype);
// Overrides
geddy.mixin(Worker.prototype, new (function () {
  this.init = function () {
    var self = this;

    this.config = {};
    this.server = null;

    // This process listens on stdin to communicate with the parent.
    this.stdin = new net.Stream(0, 'unix');

    this.createServer();
    this.addListeners();

    // Fire up stdin to receive the shared FD
    this.stdin.resume();
  };

  this.addListeners = function () {
    var self = this;

    // Listen on the passed-in shared FD and open it
    this.stdin.addListener('fd', function (fd) {
      // Setup our server process
      self.start(fd);
    });

    this.stdin.addListener('data', function (data) {
      self._parser.parse(data.toString());
    });
  };

  this.start = function (fd) {
    if (fd) {
      this.server.listenFD(fd, 'tcp4');
    }
  };

  this.sendMessage = function (msg) {
    var output = JSON.stringify(msg);
    process.stdout.write(output + '\n');
  };

})());

module.exports.Worker = Worker;

