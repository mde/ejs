
var args = process.argv.slice(2),
    child,
    opts,
    log,
    util = {},
    sys = require("sys"),
    fs = require("fs"),
    spawn = require("child_process").spawn,
    parseopts = require('geddy-core/lib/parseopts'),
    Config = require('geddy-core/lib/config').Config,
    serverRoot;

util.meta = require('geddy-util/lib/meta');
opts = parseopts.parse(args.slice());

global.config = new Config(opts);

if (opts.serverRoot) {
  serverRoot = opts.serverRoot + '/geddy-core/runserv.js';
}
else {
  serverRoot = __dirname + '/runserv.js';
}

args.unshift(serverRoot);

log = require('geddy-core/lib/log');

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
    if (data == 'DEBUG: ###shutdown###\n') {
      process.kill(child.pid);
      process.exit();
    }
    else {
      sys.puts(data);
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

