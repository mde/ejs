var sys = require('sys'),
http = require('http');
var Config = require('./framework/config').Config;
var App = require('./framework/app').App;

config = new Config(__dirname);

http.createServer(function (req, resp) {
  new App(config).run(req, resp);
}).listen(8000);


sys.puts('Server running at http://127.0.0.1:8000/');
