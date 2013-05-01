#!/usr/bin/env node

var geddy = require('../lib/geddy')
  , fs = require('fs')
  , path = require('path')
  , utils = require('utilities')
  , parseopts = require('../lib/parseopts')
  , cmd = require('../lib/cmd');

var args = process.argv.slice(2);
args = cmd.parseArgs(args);

// Jake commands -- hand off to Jake to load up env
// and run whatever command. Jake parses all the CLI
// args itself
if (args[0] == 'jake') {
  args.shift();
  var c = new cmd.JakeCmd(args);
  c.run();
}
// Generator commands -- the Cmd object will parse
// the args into commands and opts
else if (args[0] == 'gen') {
  args.shift();
  var c = new cmd.Cmd(args);
  c.run();
}
// Run the server
else {
  (function () {
    var parser
      , optsMap
      , cmds
      , opts
      , usage
      , die;

    // Server options
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
    ];

    // Parse optsMap and generate options and cmd commands
    parser = new parseopts.Parser(optsMap)
    parser.parse(args);
    cmds = parser.cmds;
    opts = parser.opts;

    // Exit the process with a message
    die = function (str) {
      console.log(str);
      process.exit();
    };

    if (opts.help) {
      var usage = fs.readFileSync(path.join(__dirname, '..',
          'usage.txt')).toString();
      return die(usage);
    }

    if (opts.version) {
      return die(geddy.version);
    }

    geddy.startCluster(opts);
  })();
}

