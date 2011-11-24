#!/usr/bin/env node

// TODO: add start/stop/restart commands, commands to create new app-layout

var childProcess = require('child_process')
  , fs = require('fs')
  , exec = require('child_process').exec
  , Server = require('../lib/server')
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
];

parser = new parseopts.Parser(optsReg);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

function start() {
  /*
  process.on('uncaughtException', function (err) {
    if (err.stack) {
      Server.emergency("Server Uncaught Exception. Exiting...");
      Server.emergency(err.stack);
      Server.stderrLog.error("Server Uncaught Exception. Exiting...");
      Server.stderrLog.error(err.stack);
    }
    Server.stderrLog.error("ERROR: " + err);
    process.exit(1);
  });
  */

  process.addListener('SIGHUP', function (d) {
    shutdownMode = true;
    restartMode = true;
    Server.stdoutLog.warning('Restarting master process ...');
    Server.sendShutdownToWorkers();
  });

  process.addListener('SIGTERM', function() {
    shutdownMode = true;
    Server.stdoutLog.warning('Graceful shutdown from SIGTERM...');
    Server.sendShutdownToWorkers();
  });

  Server.opts = opts;
  Server.start();
  // Generate a pid file
  childProcess.exec('echo ' + process.pid + ' > /tmp/xdr-proxy.pids',
      function (err, stdout, stderr) {});

}

if (typeof opts.help != 'undefined') {
  Server.die(usage);
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
        Server.die(cmds[0] + ' is not a Geddy command.');
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


