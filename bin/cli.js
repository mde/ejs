#!/usr/bin/env node

// Load the basic Geddy toolkit
var geddy = require('../lib/geddy');

var exec = require('child_process').exec
  , path = require('path')
  , parseopts = require('../lib/parseopts')
  , utils = require('../lib/utils/index')
  , parser
  , cwd = process.cwd()
  , args = process.argv.slice(2)
  , optsMap
  , cmds
  , opts
  , usage
  , cmd
  , filepath;

usage = ''
    + 'Geddy web framework for Node.js\n'
    + '*********************************************************************************************\n'
    + 'With no flags, server starts running on port 4000, on http://localhost, in development mode\n'
    + '*********************************************************************************************\n'
    + '{Usage}: geddy [options]\n'
    + '\n'
    + '{Options}:\n'
    + '  -e,   --environment          Evironment config to use\n'
    + '  -p,   --port NUM             Port number, defaults to 4000\n'
    + '  -n,   --workers NUM          Number of worker processes to use, defaults to 2\n'
    + '  -V/v, --version              Outputs the version of geddy that you have installed\n'
    + '  -d,   --debug                Sets the log level to output debug messages to the console\n'
    + '  -h,   --help                 Outputs help information\n'
    + '';

optsMap = [
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
, { full: 'version'
  , abbr: 'v'
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

parser = new parseopts.Parser(optsMap);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

var die = function (str) {
  console.log(str);
  process.exit();
};

var start = function () {
  geddy.config(opts);
  geddy.start();
};

if (typeof opts.help != 'undefined') {
  die(usage);
}
else if (typeof opts.version != 'undefined') {
  die(geddy.version);
}
else {
  // `geddy app foo` or `geddy resource bar` etc. -- run generators
  if (cmds.length) {
    filepath = path.normalize(path.join(__dirname, '..', 'templates', 'Jakefile'));
    if (process.platform == 'win32') {
      filepath = '"' + filepath + '"';
    }
    cmd = 'jake -t -f ' + filepath + ' ';
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
      case 'model':
        cmd += 'gen:model[' + cmds[1] + ']';
        break;
      case 'secret':
        cmd += 'gen:secret';
        break;
      default:
        die(cmds[0] + ' is not a Geddy command.');
    }
    cmd += ' --quiet';
    exec(cmd, function (err, stdout, stderr) {
      if (err) {
        throw err;
      }
      else {
        if (stderr) {
          console.log(utils.string.trim(stderr));
        }
        if (stdout) {
          console.log(utils.string.trim(stdout));
        }
      }
    });
  }
  // Just `geddy` -- start the server
  else {
    var configPath = path.join(cwd, 'config')
      , geddyApp = path.existsSync(configPath);

    if(geddyApp) {
      // Start the server
      start();
    } else {
      // Display help if not in a geddy application
      die(usage);
    }
  }
}


