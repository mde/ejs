var appDirname = process.argv[2];

var sys = require('sys');
var http = require('http');
var fleegix = require('geddy/lib/fleegix');
var Config = require('geddy/lib/config').Config;
var Init = require('geddy/lib/init').Init;
var App = require('geddy/lib/app').App;

config = new Config(appDirname);
config = fleegix.mixin(config, require(config.dirname + '/config/config'));

var runServ = function (initData) {
  http.createServer(function (req, resp) {
    new App(initData).run(req, resp);
  }).listen(config.port);

  sys.puts('Server running at http://127.0.0.1:' + config.port + '/');
};

new Init(config, runServ);

