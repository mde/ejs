#!/usr/bin/env node

// Dependencies
var geddy = require('../lib/geddy')
  , fs = require('fs')
  , path = require('path')
  , utils = require('utilities')
  , parseopts = require('../lib/parseopts')
  , cmd = require('../lib/cmd');

// Variables
var cwd = process.cwd()
  , args = process.argv.slice(2)
  , parser
  , optsMap
  , cmds
  , opts
  , usage
  , start;

// Options available
optsMap = [
  { full: 'origins'
  , abbr: 'o'
  , args: true
  , canon: 'origins'
  }
, { full: ['hostname', 'bind']
  , abbr: 'b'
  , args: true
  , canon: 'hostname'
  }
, { full: 'port'
  , abbr: 'p'
  , args: true
  , canon: 'port'
  }
, { full: 'workers'
  , abbr: ['n', 'w']
  , args: true
  , canon: 'workers'
  }
, { full: 'version'
  , abbr: ['v', 'V']
  , args: false
  , canon: 'version'
  }
, { full: 'help'
  , abbr: 'h'
  , args: false
  , canon: 'help'
  }
, { full: 'debug'
  , abbr: 'd'
  , args: true
  , canon: 'debug'
  }
, { full: 'loglevel'
  , abbr: 'l'
  , args: true
  , canon: 'loglevel'
  }
, { full: 'environment'
  , abbr: 'e'
  , args: true
  , canon: 'environment'
  }
, { full: 'geddy-root'
  , abbr: 'g'
  , args: true
  , canon: 'geddyRoot'
  }
, { full: 'spawned'
  , abbr: ['s', 'q', 'Q']
  , args: true
  , canon: 'spawned'
  }
, { full: 'jade'
  , abbr: 'j'
  , args: false
  , canon: 'jade'
  }
, { full: ['handle', 'handlebars']
  , abbr: 'H'
  , args: false
  , canon: 'handlebars'
  }
, { full: 'mustache'
  , abbr: 'm'
  , args: false
  , canon: 'mustache'
  }
, { full: 'realtime'
  , abbr: 'rt'
  , args: false
  , canon: 'realtime'
  }
];

// Parse optsMap and generate options and cmd commands
parser = new parseopts.Parser(optsMap);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

// Set handlebars option to handle option
opts.handle = opts.handlebars || opts.handle;

// Exit the process with a message
die = function (str) {
  console.log(str);
  process.exit();
};

// Start Geddy with options
start = function () {
  geddy.startCluster(opts);
};

if (opts.help) {
  var usage = fs.readFileSync(path.join(__dirname, '..',
      'usage.txt')).toString();
  die(usage);
}
if (opts.version) {
  die(geddy.version);
}

// `geddy app foo` or `geddy resource bar` etc. -- run generators
if (cmds.length) {
  cmd.run(cmds, opts);
}
// Just `geddy` -- start the server
else {
  start();
}
