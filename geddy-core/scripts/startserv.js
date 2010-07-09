var MIN_NODE_VERSION = '0.1.98';
var GEDDY_VERSION = '0.1.0';

global.geddy = require('geddy-core/lib/geddy');

var usage = ''
    + 'Geddy web framework for Node.js\n'
    + '********************************************************************************\n'
    + 'If no flags are given, Geddy starts in development mode on port 4000.\n'
    + '********************************************************************************\n'
    + '{Usage}: geddy [options]\n'
    + '\n'
    + '{Options}:\n'
    //+ '  -H, --host ADDR            Host address, defaults to locahost\n'
    + '  -p, --port NUM             Port number, defaults to 4000\n'
    + '  -n, --workers NUM          Number of worker processes to use\n'
    + '  -E, --environment NAME     Sets environment, defaults to "development"\n'
    + '  -r, --geddy-root PATH      Sets directory for Geddy application root\n'
    + '  -V, --version              Outputs Geddy version\n'
    + '  -h, --help                 Outputs help information\n'
    + '';

var args = process.argv.slice(2),
    parseopts = require('geddy-core/lib/parseopts'),
    parsed = parseopts.parse(args.slice()),
    cmds = parsed.cmds,
    opts = parsed.opts,
    child,
    opts, 
    log,
    sys = require("sys"),
    fs = require("fs"),
    spawn = require("child_process").spawn,
    Config = require('geddy-core/lib/config').Config,
    serverRoot,
    netBinding = process.binding('net'),
    net = require('net'),
    pids;

var die = function (str) {
  sys.puts(str);
  process.exit();
}

// check node dependency
// we must iterate because node v0.1.100 fails:
// 
// unfortunately "0.1.100" < "0.1.98" returns true
// 
var processVersonArray = process.version.split(".");
var minNodeVersonArray = MIN_NODE_VERSION.split(".");

for (var i = 0; i < 3; i++) {
  if (parseInt(processVersonArray[i]) < parseInt(minNodeVersonArray[i])){
    die('Geddy requires ' + MIN_NODE_VERSION + ' of Node.js.');
  }
}

if (typeof opts.version != 'undefined') {
  die(GEDDY_VERSION);
}

if (typeof opts.help != 'undefined') {
  die(usage);
}

geddy.config = new Config(opts);

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

var fd = netBinding.socket('tcp4');
netBinding.bind(fd, geddy.config.port);
netBinding.listen(fd, 128);

var startServ = function (restart) {
  var passArgs = restart ? args.concat('-Q', 'true') : args;
  var workerCount = opts.workers || geddy.config.workers;

  pids = [];
 
  for (var i = 0, ii = workerCount; i < ii; i++) {

    // Create an unnamed unix socket to pass the fd to the child
    // Credits: Ext's Connect, http://github.com/extjs/Connect
    var fds = netBinding.socketpair();

    // Spawn the child process
    var child = spawn(
      'node',
      passArgs, // TODO: pass these via stdin
      undefined,
      [fds[1], -1, -1]
    );

    // Patch child's stdin
    if (!child.stdin) {
      child.stdin = new net.Stream(fds[0], 'unix');
    }

    // Pass a dummy config and fd via the child's stdin
    // TODO: pass config here
    child.stdin.write(JSON.stringify({}), 'ascii', fd);
                
    child.stdout.addListener('data', function (data) {
      sys.print(data);
    });

    child.stderr.addListener('data', function (data) {
      if (data == 'DEBUG: ###shutdown###\n') {
        process.kill(child.pid);
        process.exit();
      }
      else {
        sys.print(data);
      }
    });
    child.addListener('exit', function (code) {
    });

    pids.push(child.pid);

  }

};

var restartServ = function (curr, prev) {
  // Only if the file has been modified
  if (curr.mtime.getTime() != prev.mtime.getTime()) {
    log.info('Restarting server for changed code...').flush();
    for (var i = 0, ii = pids.length; i < ii; i++) {
      process.kill(pids[i]);
    }
    startServ(true);
  }
};

startServ();

var hostname;
if (geddy.config.hostname) { hostname = geddy.config.hostname; }

if (geddy.config.environment == 'development') {
  // watch individual files so we can compare mtimes in restartServ
  watchTree(geddy.config.dirname + '/config', restartServ);
  watchTree(geddy.config.dirname + '/lib', restartServ);
  watchTree(geddy.config.dirname + '/app/controllers', restartServ);
  watchTree(geddy.config.dirname + '/app/models', restartServ);
}

