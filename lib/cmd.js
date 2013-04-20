var path = require('path')
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
, 'scaffold': ['primary', 'rt', 'template', 'model']
, 'controller': ['primary', 'template']
, 'secret': []
, 'auth': ['template']
, 'auth:update': []
};

exports.run = function (cmds, opts) {
    var genCmds
      , initCmd = cmds[0].split(':')[0]; // Handle e.g., auth:update

    genCmds = {
      auth: true
    , secret: true
    , resource: true
    , scaffold: true
    , controller: true
    , model: true
    };

    // If the inital command is a generator command, generate
    // deprecation warning, and proceed
    if (genCmds[initCmd]) {
      console.log('=======================');
      console.log(' NOTE: calling ' + cmds[0] + ' command directly is ' +
          'deprecated.\n Please use `geddy gen ' + cmds[0] + '`');
      console.log('=======================');
      cmds.unshift('gen');
    }
    // 'console' is a special case API method for `jake console`
    else if (initCmd == 'console') {
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
      jakeCmd.run(cmds, opts);
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

  this.parseArgs(cmds, opts);
  this.createJakeTaskName();
};

Cmd.prototype = new (function () {
  this.run = function () {
    this.createJake();
    this.initJake();
    this.runJake();
  };

  this.parseArgs = function (cmds, opts) {
    var args = this.namedArgs
      , model = ''
      , template = 'default'
      , rt = 'default';

    // Parse the primary arg out of the args
    // This is the main arg passed to each Jake task
    // e.g., the app name, model name, etc.
    args.primary = cmds[1];

    // Get the model properties
    if (cmds.slice(2).length) {
      // Use percents to delimit, since this gets passed to Jake
      model = cmds.slice(2).join('%');
    }
    args.model = model;

    // Template-language options
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

genCmd = new (function () {
  this.run = function (cmds, opts) {
    var cmd = ''
      , dirpath = path.normalize(path.join(__dirname, '..', 'gen'))
      , filepath = path.normalize(path.join(dirpath, 'Jakefile'));

    // Some commands take only one arg
    if (!(cmds[0] == 'jake' ||
        cmds[0] == 'secret' ||
        cmds[0] == 'auth' ||
        cmds[0] == 'auth:update' ||
        cmds[0] == 'console' ||
        cmds[0] == 'routes')
        && !cmds[1]) {
      throw new Error(cmds[0] + ' command requires another argument.');
    }

    // Add engines to command
    if (opts.jade) {
      engineCmd = ',jade';
    }
    else if (opts.handle) {
      engineCmd = ',handlebars';
    }
    else if (opts.mustache) {
      engineCmd = ',mustache';
    }
    else {
      engineCmd = ',default';
    }

    if (opts.realtime) {
      rtCmd = ',realtime';
    }
    else {
      rtCmd = ',default';
    }

    // Get the model properties
    if (cmds.slice(2).length > 0) {
      modelCmd = ',' + cmds.slice(2).join('%');
    }
    else {
      modelCmd = '';
    }

    // Add Jake argument based on commands
    switch (cmds[0]) {
      case 'jake':
        cmd = 'jake';
        jakeArgs = cmds.slice(1);
        break;
      case 'console':
        // Start console
        cmd += 'console:start[' + (cmds[1] || 'development') + ']';
        break;
      case 'auth':
        // Create authentication
        cmd += 'auth:init[' + engineCmd.substr(1) + ']';
        break;
      case 'auth:update':
        // Update authentication
        cmd += 'auth:update';
        break;
      case 'app':
        // Generating application
        cmd += 'gen:app[' + cmds[1] + engineCmd + rtCmd + ']';
        break;
      case 'model':
        // Generating model
        cmd += 'gen:model[' + cmds[1] + modelCmd + ']';
        break;
      case 'resource':
        // Generating resource
        cmd += 'gen:resource[' + cmds[1] + modelCmd + ']';
        break;
      case 'scaffold':
        // Generating application
        cmd += 'gen:scaffold[' + cmds[1] + rtCmd + engineCmd + modelCmd + ']';
        break;
      case 'controller':
        // Generating controller
        cmd += 'gen:bareController[' + cmds[1] + engineCmd + ']';
        break;
      case 'secret':
        // Generating new app secret
        cmd += 'gen:secret';
        break;
      // This should be `geddy jake routes` because it's non-gen and local
      case 'routes':
        // Show routes(Optionally empty)
        cmd += 'routes:show[' + (cmds[1] || '') + ']';
        break;
      default:
        console.log(cmds[0] + ' is not a Geddy command.');
        process.exit();
    }

    var jake = require('jake')
      , dirpath = path.normalize(path.join(__dirname, '..', 'gen'))
      , filepath = path.normalize(path.join(dirpath, 'Jakefile'));

    jakeProgram = jake.program;
    jakeLoader = jake.loader;
    // Load Geddy's bundled Jakefile
    jakeLoader.loadDirectory(path.join(dirpath, 'jakelib'));
    jakeLoader.loadFile(filepath);
    if (cmd == 'jake') {
      jakeProgram.parseArgs(jakeArgs);
      // Load Jakefile and jakelibdir files for app
      jakeLoader.loadFile(jakeProgram.opts.jakefile);
      jakeLoader.loadDirectory(jakeProgram.opts.jakelibdir);
      // Prepend env:init to load Geddy env
      jakeProgram.taskNames.unshift('env:init');
      jakeProgram.init();
    }
    else {
      jakeProgram.init({
        quiet: !opts.debug
      , trace: true
      });
      jakeProgram.setTaskNames([cmd]);
    }
    jakeProgram.run();
  };

})();

exports.Cmd = Cmd;
