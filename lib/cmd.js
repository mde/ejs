var path = require('path')
  , utils = require('utilities')
  , gen
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
};

exports.run = function (cmds, opts) {
    var genCmds
      , jakeCmds
      , initCmd = cmds[0].split(':')[0]; // Handle e.g., auth:update

    genCmds = {
      app: true
    , auth: true
    , secret: true
    , resource: true
    , scaffold: true
    , controller: true
    , model: true
    };
    jakeCmds = {
      console: true
    , routes: true
    }

    // Gen commands
    if (genCmds[initCmd]) {
      console.log('=======================');
      console.log(' NOTE: `' + cmds[0] + '` command is ' +
          'deprecated.\n Please use `geddy gen ' + cmds[0] + '`');
      console.log('=======================');
      cmds.unshift('gen');
    }
    // Jake commands
    else if (jakeCmds[initCmd]) {
      console.log('=======================');
      console.log(' NOTE: `' + cmds[0] + '` command is ' +
          'deprecated.\n Please use `geddy jake ' + cmds[0] + '`');
      console.log('=======================');
      cmds.unshift('jake');
    }

    // Generators
    if (cmds[0] == 'gen') {
      cmds.shift(); // Run just the commands
      //genCmd.run(cmds, opts);
      var c = new Cmd(cmds, opts);
      c.run();
    }
    // Jake execution locally in the app
    else if (cmds[0] == 'jake') {
      cmds.shift(); // Run just the commands
      var c = new JakeCmd(cmds, opts);
      c.run();
    }

};

var Cmd = function (cmds, opts) {
  this.cmds = cmds;
  this.opts = opts;
  this.namedArgs = {
    primary: ''
  , model: ''
  , template: ''
  , rt: ''
  };
  this.baseTaskName = cmds[0];
  this.jakeTaskName = '';
  this.jakeProgram = null;
  this.jakeLoader = null;

  this.createJake();
  this.parseArgs();
  this.createJakeTaskName();
};

Cmd.prototype = new (function () {
  this.run = function () {
    this.initJake();
    this.runJake();
  };

  this.parseArgs = function () {
    var cmds = this.cmds
      , opts = this.opts
      , args = this.namedArgs
      , model = ''
      , template = 'default'
      , rt = 'default';

    // Parse the primary arg out of the args
    // This is the main arg passed to each Jake task
    // e.g., the app name, model name, etc.
    // ------
    args.primary = cmds[1];

    // Get the model properties
    // ------
    if (cmds.slice(2).length) {
      // Use percents to delimit, since this gets passed to Jake
      model = cmds.slice(2).join('%');
    }
    args.model = model;

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
    args.template = template;

    // Set up RT?
    // ------
    if (opts.realtime) {
      rt = 'realtime';
    }
    args.rt = rt;
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
    this.jakeProgram.init({
      quiet: !this.opts.debug
    , trace: this.opts.debug
    });
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
  this.parseArgs = function () {
    // Just pass along raw args
    this.jakeProgram.parseArgs(this.cmds);
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

exports.Cmd = Cmd;
