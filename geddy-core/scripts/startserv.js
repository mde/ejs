
var util = {};
var sys = require("sys");
var fs = require("fs");
var spawn = require("child_process").spawn;
var parseopts = require('geddy-core/lib/parseopts');
var args = process.argv.slice(2);
var Config = require('geddy-core/lib/config').Config;
util.meta = require('geddy-util/lib/meta');

var opts = parseopts.parse(args.slice());
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
var log = require('geddy-core/lib/log');

var jsPat = /\.js$/;
// Recursively watch files with a callback
var watchTree = function (path, func) {
  fs.stat(path, function (err, stats) {
    if(err) {
      return false;
    }
    if (stats.isFile() && jsPat.test(path)) {
      fs.watchFile(path, func);
    }
    else if (stats.isDirectory()) {
      fs.readdir(path, function (err, files) {
        if (err) {
          return log.fatal(err);
        }
        for (var f in files) {
          watchTree(path + '/' + files[f], func);
        }
      });
    } 
  })
};

var startServ = function (restart) {
  passArgs = restart ? args.concat('-Q', 'true') : args;
  child  = spawn('node', passArgs);
  child.stdout.addListener('data', function (data) {
    sys.puts(data);
  });
  child.stderr.addListener('data', function (data) {
    process.kill(child.pid);
    if (data instanceof Error) {
      throw data;
    }
    else {
      throw new Error(data);
    }
  });
  child.addListener('exit', function (code) {
    //sys.puts('child process exited with code ' + code);
  });
};

var restartServ = function (curr, prev) {
  // Only if the file has been modified
  if (curr.mtime.getTime() != prev.mtime.getTime()) {
    log.info('Restarting server for changed code...').flush();
    process.kill(child.pid);
    startServ(true);
  }
};

startServ();

var hostname;
if (config.hostname) { hostname = config.hostname; }

if (config.environment == 'development') {
  // watch individual files so we can compare mtimes in restartServ
  watchTree(config.dirname + '/config', restartServ);
  watchTree(config.dirname + '/lib', restartServ);
  watchTree(config.dirname + '/app/controllers', restartServ);
  watchTree(config.dirname + '/app/models', restartServ);
}

