#!/usr/bin/env node

// TODO: add start/stop/restart commands
// command to create new project layout too

var Server = require(__dirname + '/../lib/server')
  , parseopts = require(__dirname + '/../lib/parseopts')
  , args = process.argv.slice(2)
  , childProcess = require('child_process')
  , fs = require('fs');

var usage = ''
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

Parser = new parseopts.Parser(optsReg);
parsed = Parser.parse(args);
opts = Parser.opts;

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

start();

