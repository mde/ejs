var sys = require('sys');
var http = require('http');
var Config = require('geddy/lib/config').Config;
var App = require('geddy/lib/app').App;
var appDirname = process.argv[2];

config = new Config(appDirname);

http.createServer(function (req, resp) {
  new App(config).run(req, resp);
}).listen(8000);


sys.puts('Server running at http://127.0.0.1:8000/');


