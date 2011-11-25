var http = require('http')
  , net
  , Worker;

if (geddy.FD_HACK) {
  net = net || require('net');
}

Worker = function () {
  var self = this;

  this.stdin = null;
  this.config = {};

  this.server = http.Server(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  });

  if (geddy.FD_HACK) {
    // This process listens on stdin to communicate with the parent.
    this.stdin = new net.Stream(0, 'unix');
    // Setup our server process,
    // Listen on the passed-in shared FD and open it
    this.stdin.addListener('fd', function (fd) {
      self.start(fd);
    });
    this.stdin.addListener('data', function (data) {
      self.receiveMessage(data.toString());
    });
    this.stdin.resume();
  }
  else {
    process.addListener('message', function (data) {
      self.receiveMessage(data);
    });
  }

};

Worker.prototype = new (function () {
  this.start = function (fd) {
    if (fd) {
      this.server.listenFD(fd, 'tcp4');
    }
    else {
      this.server.listen(this.config.port);
    }
  };

  this.configure = function (config) {
    this.config = config;
  };

  this.sendMessage = function (msg) {
    var output;
    if (geddy.FD_HACK) {
      output = JSON.stringify(msg);
      process.stdout.write(output + '\n');
    }
    else {
      process.send(msg);
    }
  };

  this.receiveMessage = function (msg) {
    console.log('received in child: ' + JSON.stringify(msg));
  };

})();

module.exports.Worker = Worker;
