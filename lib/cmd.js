var path = require('path')
  , utils = require('utilities')
  , parseopts = require('./parseopts')
  , cmd = {}
  , engineCmd
  , rtCmd
  , modelCmd
  , die
  , jakeArgs
  , jakeProgram
  , jakeLoader

var _taskArgsMap = {
  'app': ['primary', 'template', 'rt']
, 'model': ['primary', 'model']
, 'resource': ['primary', 'model']
, 'scaffold': ['primary', 'model', 'template', 'rt']
, 'controller': ['primary', 'template']
, 'secret': []
, 'auth': ['template']
, 'auth:update': []
, 'migration': ['primary']
};

cmd = new (function () {
    var genCmds
      , jakeCmds;

    genCmds = {
      'app': true
    , 'auth': true
    , 'auth:update': true
    , 'secret': true
    , 'resource': true
    , 'scaffold': true
    , 'controller': true
    , 'model': true
    , 'migration': true
    };

    jakeCmds = {
      'console': true
    , 'routes': true
    , 'db:init': true
    };

  this.parseArgs = function (args) {
    var initArg = args[0]
      , ret;
    // No args, or first arg is an option -- assume no commands,
    // running server. Bail out with current args
    if (!args.length || initArg.indexOf('-') === 0) {
      return args;
    }
    else {
      ret = args.slice();
    }

    // Gen commands
    if (genCmds[initArg]) {
      console.log('=======================');
      console.log(' NOTE: `' + ret[0] + '` command is ' +
          'deprecated.\n Please use `geddy gen ' + ret[0] + '`');
      console.log('=======================');
      ret.unshift('gen');
    }
    // Jake commands
    else if (jakeCmds[initArg]) {
      if (ret[0] !=  'console') { // Grandfather the `console` cmd
        console.log('=======================');
        console.log(' NOTE: `' + ret[0] + '` command is ' +
            'deprecated.\n Please use `geddy jake ' + ret[0] + '`');
        console.log('=======================');
      }
      ret.unshift('jake');
    }
    else {
      if (initArg == 'gen') {
        if (!genCmds[ret[1]]) {
          throw new Error(initArg + ' ' + ret[1] +
              ' is not a valid geddy command.');
        }
      }
      else {
        if (initArg != 'jake') {
          throw new Error(initArg + ' is not a valid geddy command.');
        }
      }
    }
    return ret;
  };

})();


var Cmd = function (args) {
  this.cmds = null;
  this.opts = null;
  this.namedArgs = {
    primary: ''
  , model: ''
  , template: ''
  , rt: ''
  };
  this.baseTaskName = args[0];
  this.jakeTaskName = '';
  this.jakeProgram = null;
  this.jakeLoader = null;

  this.createJake();
  this.parseArgs(args);
  this.createJakeTaskName();
};

Cmd.prototype = new (function () {

  // Options available -- probably should have gone with
  // '--template=jade' instead of a flag for each template type
  var _optsMap = [
    { full: ['trace', 'debug']
    , abbr: ['t', 'd']
    , args: false
    , canon: 'trace'
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
  , { full: 'swig'
    , abbr: 's'
    , args: false
    , canon: 'swig'
    }
  , { full: 'realtime'
    , abbr: 'rt'
    , args: false
    , canon: 'realtime'
    }
  ];

  this.run = function () {
    this.initJake();
    this.runJake();
  };

  this.parseArgs = function (args) {
    var parser
      , cmds
      , opts
      , namedArgs = this.namedArgs
      , model = ''
      , template = 'default'
      , rt = 'default';

    parser = new parseopts.Parser(_optsMap);
    parser.parse(args);
    cmds = parser.cmds;
    opts = parser.opts;
    // Set handlebars option to handle option
    if (opts.handlebars) {
      opts.handle = opts.handlebars;
    }

    this.cmds = cmds;
    this.opts = opts;

    // Parse the primary arg out of the args
    // This is the main arg passed to each Jake task
    // e.g., the app name, model name, etc.
    // ------
    namedArgs.primary = cmds[1];

    // Get the model properties
    // ------
    if (cmds.slice(2).length) {
      // Use percents to delimit, since this gets passed to Jake
      model = cmds.slice(2).join('%');
    }
    namedArgs.model = model;

    // Template-language options
    // ------
    if (opts.jade) {
      template = 'jade';
    }
    else if (opts.handle) {
      template = 'handlebars';
    }
    else if (opts.mustache) {
      template = 'mustache';
    }
    else if (opts.swig) {
      template = 'swig';
    }
    namedArgs.template = template;

    // Set up RT?
    // ------
    if (opts.realtime) {
      rt = 'realtime';
    }
    namedArgs.rt = rt;
  };

  this.createJakeTaskName = function () {
    var name = this.baseTaskName
      , namedArgs = this.namedArgs
      , argNames = _taskArgsMap[name]
      , args = [];
    name = 'gen:' + name;
    // Get any value parsed out for each of the specified named args
    // for this particular task
    argNames.forEach(function (n) {
      args.push(namedArgs[n]);
    });
    name += '[' + args.join(',') + ']';
    this.jakeTaskName = name;
  };

  this.createJake = function () {
    var jake = require('jake')
      , dirpath = path.normalize(path.join(__dirname, '..', 'gen'))
      , filepath = path.normalize(path.join(dirpath, 'Jakefile'));
    this.jakeProgram = jake.program;
    this.jakeLoader = jake.loader;
    // Load Geddy's bundled Jakefile
    this.jakeLoader.loadDirectory(path.join(dirpath, 'jakelib'));
    this.jakeLoader.loadFile(filepath);
  };

  this.initJake = function () {
    this.jakeProgram.init({options: {
      trace: this.opts.trace
    }});
    this.jakeProgram.setTaskNames([this.jakeTaskName]);
  };

  this.runJake = function () {
    this.jakeProgram.run();
  };
})();

var JakeCmd = function (cmd, opts) {
  Cmd.apply(this, arguments);
};

JakeCmd.prototype = Object.create(Cmd.prototype);
JakeCmd.prototype.constructor = JakeCmd;

// Override a couple of methods
utils.mixin(JakeCmd.prototype, new (function () {
  this.parseArgs = function (args) {
    // Let Jake parse the raw args directly
    this.jakeProgram.parseArgs(args);
  };

  this.initJake = function () {
    // Load Jakefile and jakelibdir files for app
    this.jakeLoader.loadFile(this.jakeProgram.opts.jakefile);
    this.jakeLoader.loadDirectory(this.jakeProgram.opts.jakelibdir);
    // Prepend env:init to load Geddy env
    this.jakeProgram.taskNames.unshift('env:init');
    this.jakeProgram.init();
  };

  // Override, no-op -- don't need a task-name with
  // bracket params -- setting directly
  this.createJakeTaskName = function () {};

})());

cmd.Cmd = Cmd;
cmd.JakeCmd = JakeCmd;

module.exports = cmd;
