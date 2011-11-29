#!/usr/bin/env node

// TODO: add start/stop/restart commands, commands to create new app-layout

var geddy = global.geddy = {};

var fs = require('fs')
  , exec = require('child_process').exec
  , parseopts = require('../lib/parseopts')
  , utils = require('../lib/utils/index')
  , parser
  , args = process.argv.slice(2)
  , optsReg
  , cmds
  , opts
  , usage
  , cmd;

usage = ''
    + 'Geddy web framework for Node.js\n'
    + '*********************************************************************************************\n'
    + 'With no flags, server starts running on port 4000, accepting requests from http://localhost.\n'
    + '*********************************************************************************************\n'
    + '{Usage}: xdr-proxy [options]\n'
    + '\n'
    + '{Options}:\n'
    + '  -e, --environment          Evironment config to use\n'
    + '  -o, --origins HOSTNAME      Allow requests from HOSTNAME (should include protocol)\n'
    + '  -p, --port NUM             Port number, defaults to 4000\n'
    + '  -n, --workers NUM          Number of worker processes to use, defaults to 2\n'
    + '  -h, --help                 Outputs help information\n'
    + '';

optsReg = [
  { full: 'origins'
  , abbr: 'o'
  }
, { full: 'port'
  , abbr: 'p'
  }
, { full: 'workers'
  , abbr: 'n'
  }
, { full: 'version'
  , abbr: 'V'
  }
, { full: 'help'
  , abbr: 'h'
  }
, { full: 'debug'
  , abbr: 'd'
  }
, { full: 'logLevel'
  , abbr: 'l'
}
, { full: 'environment'
  , abbr: 'e'
  }
, { full: 'spawned'
  , abbr: 'Q'
  }
];

parser = new parseopts.Parser(optsReg);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

var start = function () {

  var cluster
    , master
    , worker
    , m
    , w;

  // Node 0.6
  try {
    cluster = require('cluster');
    geddy.FD_HACK = false;
    master = require('../lib/cluster/master')
    worker = require('../lib/cluster/worker');
  }
  // Node 0.4
  catch (e) {
    geddy.FD_HACK = true;
    master = require('../lib/cluster/hack_master')
    worker = require('../lib/cluster/hack_worker');
  }

  // Master-process
  if ((cluster && cluster.isMaster) ||
      (geddy.FD_HACK && !opts.spawned)) {
    m = new master.Master();
    m.start(opts);
  }
  // Worker-process -- start up an app
  else {
    var App = require('../lib/app.js').App;
    var app = new App();
    geddy.mixin(geddy, app);
  }

  /*
  process.addListener('SIGHUP', function (d) {
    shutdownMode = true;
    restartMode = true;
    //Master.stdoutLog.warning('Restarting master process ...');
    //Master.sendShutdownToWorkers();
  });

  process.addListener('SIGTERM', function() {
    shutdownMode = true;
    //Master.stdoutLog.warning('Graceful shutdown from SIGTERM...');
    //Master.sendShutdownToWorkers();
  });
  */

};

if (typeof opts.help != 'undefined') {
  m.die(usage);
}
else {
  // `geddy app foo` or `geddy resource bar` etc. -- run generators
  if (cmds.length) {
    cmd = 'jake -t -f /' + __dirname + '/../Jakefile ';
    if (cmds[0] != 'secret' && !cmds[1]) {
      throw new Error(cmds[0] + ' command requires another argument.');
    }
    switch (cmds[0]) {
      case 'app':
        cmd += 'gen:app[' + cmds[1] + ']';
        break;
      case 'resource':
        cmd += 'gen:resource[' + cmds[1] + ']';
        break;
      case 'controller':
        cmd += 'gen:bareController[' + cmds[1] + ']';
        break;
      case 'secret':
        cmd += 'gen:secret';
        break;
      default:
        m.die(cmds[0] + ' is not a Geddy command.');
    }
    cmd += ' generator=true'
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      else if (stderr) {
        console.log(stderr);
      }
      else {
        console.log(utils.string.trim(stdout));
      }
    });
  }
  // Just `geddy` -- start the server
  else {
    start();
  }
}


