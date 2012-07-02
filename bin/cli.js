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

// Help dialog
usage = [
    'Geddy web framework for Node.js'
  , ''
  , 'With no flags, Geddy starts on port 4000, on http://localhost in development mode'
  , ''
  , 'Usage: geddy [options] [arguments]'
  , ''
  , 'Options:'
  , '  --environment, -e   # Environment to use'
  , '  --port, -p          # Port to connect to'
  , '  --workers, -w       # Number of worker processes to use(default: 2)'
  , '  --version, -v       # Output the version of Geddy installed'
  , '  --debug, -d         # Sets the log level to output debug messages to the console'
  , '  --help, -h          # Output the help dialog'
  , '  --jade, -j          # Generate Jade templates for the app/resource/controller'
  , '                        commands(Default: EJS)'
  , '  --handle, -H        # Generate Handlebars templates for the'
  , '                        app/resource/controller commands(Default: EJS)'
  , '  --mustache, -m      # Generate Mustache templates for the'
  , '                        app/resource/controller commands(Default: EJS)'
  , ''
  , '  app                 # Create a new Geddy application'
  , '  resource            # Create a new resource'
  , '                        (Views, Model, Controller and resource route)'
  , '  secret              # Create new app secret in `environment.js`'
  , '  controller          # Generate a new controller(views and routes included)'
  , '  model               # Generate a new model'
  , ''
].join('\n');

// Options available
optsMap = [
    { full: 'origins', abbr: 'o' }
  , { full: 'port', abbr: 'p' }
  , { full: 'workers', abbr: 'n' } // Compat
  , { full: 'workers', abbr: 'w' }
  , { full: 'version', abbr: 'v' }
  , { full: 'version', abbr: 'V' } // Compat
  , { full: 'help', abbr: 'h' }
  , { full: 'debug', abbr: 'd' }
  , { full: 'loglevel', abbr: 'l' }
  , { full: 'environment', abbr: 'e' }
  , { full: 'spawned', abbr: 'Q' } // Compat
  , { full: 'spawned', abbr: 'q' } // Compat
  , { full: 'spawned', abbr: 's' }
  , { full: 'jade', abbr: 'j' }
  , { full: 'handle', abbr: 'H' }
  , { full: 'handlebars', abbr: 'H' }
  , { full: 'mustache', abbr: 'm' }
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
