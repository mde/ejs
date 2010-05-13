
var util = {};
var sys = require("sys");
var fs = require("fs");
var spawn = require("child_process").spawn;
var parseopts = require('geddy-core/lib/parseopts');
var args = process.argv.slice(2);
var Config = require('geddy-core/lib/config').Config;
util.meta = require('geddy-util/lib/meta');

var optsReg = {
  geddyRoot: ['-r', '--geddy-root'],
  serverRoot: ['-x', '--server-root'],
  host: ['-h', '--host'],
  port: ['-p', '--port'],
  environment: ['-e', '--environment'],
  restart: ['-Q', '--restart']
};

var opts = parseopts.parse(args.slice(), optsReg);
config = new Config(opts);
var serverRoot;
if (opts.serverRoot) {
  serverRoot = opts.serverRoot + '/geddy-core/runserv.js';
}
else {
  serverRoot = __dirname + '/runserv.js';
}
args.unshift(serverRoot);
var child;

var startServ = function (restart) {
  passArgs = restart ? args.concat('-Q', 'true') : args;
  child  = spawn('node', args);
  child.stdout.addListener('data', function (data) {
    sys.print(data);
  });
  child.stderr.addListener('data', function (data) {
    //throw new Error(data);
    sys.print(data);
  });
  child.addListener('exit', function (code) {
    //sys.puts('child process exited with code ' + code);
  });
};

var restartServ = function (oldStat, newStat) {
  process.kill(child.pid);
  startServ(true);
};

startServ();

var hostname;
if (config.hostname) { hostname = config.hostname; }

if (config.environment == 'development') {
  fs.watchFile(config.dirname + '/config', restartServ);
  fs.watchFile(config.dirname + '/lib', restartServ);
  fs.watchFile(config.dirname + '/app/controllers/', restartServ);
  fs.watchFile(config.dirname + '/app/models/', restartServ);
}
