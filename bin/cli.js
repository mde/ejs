#!/usr/bin/env node

// Dependencies
var geddy = require('../lib/geddy')
  , exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , parseopts = require('../lib/parseopts')
  , utils = require('../lib/utils/index');

// Variables
var cwd = process.cwd()
  , args = process.argv.slice(2)
  , parser
  , optsMap
  , cmds
  , opts
  , usage
  , cmd
  , filepath
  , die
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
  , '  --port, -p          Port to connect to'
  , '  --workers, -w       Number of worker processes to start(Default: 2)'
  , '  --debug, -d         Sets the log level to output debug messages to'
  , '                        the console'
  , '  --help, -h          Output this usage dialog'
  , '  --version, -v       Output the version of Geddy that\'s installed'
  , '  --jade, -j          When generating views this will create Jade'
  , '                        templates(Default: EJS)'
  , '  --handle, -H        When generating views this will create Handlebars'
  , '                        templates(Default: EJS)'
  , '  --Mustache, -m      When generating views this will create Mustache'
  , '                        templates(Default: EJS)'
  , ''
  , 'Commands:'
  , '  app [name]          Create a new Geddy application'
  , '  resource [name]     Create a new resource. A resource includes'
  , '                        the views, model, controller and a route'
  , '  secret              Generate a new application secret in'
  , '                        `congig/environment`'
  , '  controller [name]   Generate a new controller including views'
  , '                        and and a route'
  , '  model [name]        Generate a new model'
  , ''
  , 'Examples:'
  , '  geddy                    Start Geddy on localhost:4000 in development mode'
  , '                             or if the directory isn\'t a Geddy app it\'ll'
  , '                             this usage dialog'
  , '  geddy -p 3000            Start Geddy on port 3000'
  , '  geddy -e production      Start Geddy in production mode'
  , '  geddy resource users     Generate a users resource using EJS templates'
  , '  geddy -j resource users  Generate a users resource using Jade templates'
  , ''
].join('\n');

// Options available
optsMap = [
    { full: 'origins', abbr: 'o' }
  , { full: 'port', abbr: 'p' }
  , { full: 'workers', abbr: ['n', 'w'] }
  , { full: 'version', abbr: ['v', 'V'], args: false }
  , { full: 'help', abbr: 'h', args: false }
  , { full: 'debug', abbr: 'd' }
  , { full: 'loglevel', abbr: 'l' }
  , { full: 'environment', abbr: 'e' }
  , { full: 'spawned', abbr: ['s', 'q', 'Q'] }
  , { full: 'jade', abbr: 'j', args: false }
  , { full: 'handle', abbr: 'H', args: false }
  , { full: 'handlebars', abbr: 'H', args: false }
  , { full: 'mustache', abbr: 'm', args: false }
];

// Parse optsMap and generate options and cmd commands
parser = new parseopts.Parser(optsMap);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

// Set handlebars option to handle option
opts.handle = opts.handlebars || opts.handle;

// Exit the process with a message
die = function(str) {
  console.log(str);
  process.exit();
};

// Start Geddy with options
start = function() {
  geddy.config(opts);
  geddy.start();
};

if(opts.help) die(usage);
if(opts.version) die(geddy.version);

// `geddy app foo` or `geddy resource bar` etc. -- run generators
if(cmds.length) {
  filepath = path.normalize(path.join(__dirname, '..', 'templates', 'Jakefile'));

  // Wrap quotes in case path has spaces
  if(process.platform === 'win32') filepath = '"' + filepath + '"';
  cmd = 'jake -t -f ' + filepath + ' ';

  // If command isn't secret and has no other argument
  if (cmds[0] !== 'secret' && !cmds[1]) {
    throw new Error(cmds[0] + ' command requires another argument.');
  }

  switch(cmds[0]) {
    case 'app':
      // Generating application
      cmd += 'gen:app[' + cmds[1];

      if(opts.jade) cmd += ',' + 'jade';
      if(opts.handle) cmd += ',' + 'handlebars';
      if(opts.mustache) cmd += ',' + 'mustache';

      cmd += ']';
      break;
    case 'resource':
      // Generating resources
      cmd += 'gen:resource[' + cmds[1];

      if(opts.jade) cmd += ',' + 'jade';
      if(opts.handle) cmd += ',' + 'handlebars';
      if(opts.mustache) cmd += ',' + 'mustache';

      cmd += ']';
      break;
    case 'controller':
      // Generating controller
      cmd += 'gen:bareController[' + cmds[1];

      if(opts.jade) cmd += ',' + 'jade';
      if(opts.handle) cmd += ',' + 'handlebars';
      if(opts.mustache) cmd += ',' + 'mustache';

      cmd += ']';
      break;
    case 'model':
      // Generating model
      cmd += 'gen:model[' + cmds[1] + ']';
      break;
    case 'secret':
      // Generating new app secret
      cmd += 'gen:secret';
      break;
    default:
      die(cmds[0] + ' is not a Geddy command.');
  }

  cmd += ' --quiet';
  exec(cmd, function(err, stdout, stderr) {
    if(err) throw err;

    if(stderr) console.log(utils.string.trim(stderr));
    if(stdout) console.log(utils.string.trim(stdout));
  });
}
// Just `geddy` -- start the server
else {
  var relPath = '';

  // Search for the `config` directory needed to run Geddy
  // - up to 5 parent directories then show the usage
  for(var i = 0, len = utils.file.maxParentDir; i <= len; i++) {
    var configPath = path.join(cwd, relPath, 'config')
      , existsSync = typeof fs.existsSync == 'function' ?
          fs.existsSync : path.existsSync
      , geddyApp = existsSync(configPath);

    if(geddyApp) {
      break;
    } else {
      // If 5 directories up show usage
      if(i === len) die(usage);

      // Add a relative parent directory
      relPath += '../';
      process.chdir(path.join(cwd, relPath));
    }
  }
  start(); // Start the server up
}
