var appDirname = process.argv[2];

var sys = require('sys');
var http = require('http');

var fleegix = require('geddy/lib/fleegix');

var Config = require('geddy/lib/config').Config;
var Init = require('geddy/lib/init').Init;
var App = require('geddy/lib/app').App;

var runServ = function () {
  http.createServer(function (req, resp) {
    new App().run(req, resp);
  }).listen(config.port);

  sys.puts('Server running at http://127.0.0.1:' + config.port + '/');
};

var config = new Config(appDirname);
// Initialize the app, passing in the config, and runServ at its callback
new Init(config, runServ);


