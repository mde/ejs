#!/usr/bin/env node

// Dependencies
var geddy = require('../lib/geddy')
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

// Usage dialog
usage = [
    'Geddy web framework for Node.js'
  , ''
  , 'Usage:'
  , '  geddy [options/commands] [arguments]'
  , ''
  , 'Options:'
  , '  --environment, -e   Environment to use'
  , '  --hostname, -b      Host name or IP to bind the server to (default: localhost)'
  , '  --port, -p          Port to bind the server to (default: 4000)'
  , '  --geddy-root, -g    /path/to/approot The path to the root for the app you want'
  , '                        to run (default is current working directory)'
  , '  --workers, -w       Number of worker processes to start (default: 1)'
  , '  --debug, -d         Sets the log level to output debug messages to'
  , '                        the console'
  , '  --realtime, -rt     When generating or scaffolding, take realtime into account'
  , '  --jade, -j          When generating views this will create Jade'
  , '                        templates(Default: EJS)'
  , '  --handle, -H        When generating views this will create Handlebars'
  , '                        templates(Default: EJS)'
  , '  --mustache, -m      When generating views this will create Mustache'
  , '                        templates(Default: EJS)'
  , '  --help, -h          Output this usage dialog'
  , '  --version, -v       Output the version of Geddy that\'s installed'
  , ''
  , 'Commands:'
  , '  console                     Start up the Geddy REPL'
  , '  app <name>                  Create a new Geddy application'
  , '  resource <name> [attrs]     Create a new resource. A resource includes'
  , '                                a model, controller and route'
  , '  scaffold <name> [attrs]     Create a new scaffolding. Scaffolding includes'
  , '                                the views, a model, controller and route'
  , '  secret                      Generate a new application secret in'
  , '                                `config/secret`'
  , '  controller <name>           Generate a new controller including an index view'
  , '                                and and a route'
  , '  model <name> [attrs]        Generate a new model'
  , '  routes [query]              Shows routes for a given resource route or all '
  , '                                routes if empty'
  , '  auth[:update]               Creates user authentication for you, using Passport.'
  , ''
  , 'Examples:'
  , '  geddy                    Start Geddy on localhost:4000 in development mode'
  , '                             or if the directory isn\'t a Geddy app it\'ll'
  , '                             display a prompt to use "geddy -h"'
  , '  geddy -p 3000            Start Geddy on port 3000'
  , '  geddy -e production      Start Geddy in production mode'
  , '  geddy -j scaffold user   Generate a users scaffolding using Jade templates'
  , '  geddy resource user name admin:boolean'
  , '                           Generate a users resource with the model properties'
  , '                             name as a string and admin as a boolean'
  , '  geddy scaffold user name:string:default'
  , '                           Generate a users scaffolding user name as the default'
  , '                             value to display data with'
  , '  geddy routes user        Show all routes for the user resource'
  , '  geddy routes user.index  Show the index route for the user resource'
  , ''
].join('\n');

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
