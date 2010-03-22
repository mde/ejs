var sys = require('sys');
var args = process.argv.slice(2);

var opts = {};
var optsReg = {
  directory: ['-C', '--directory'],
  jakefile: ['-f', '--file']
};
var optsReverseMap = {};
var optsItem;
for (var p in optsReg) {
  opts[p] = null;
  optsItem = optsReg[p];
  for (var i = 0; i < optsItem.length; i++) {
    optsReverseMap[optsItem[i]] = p;
  }
}

var taskName;
var arg;
var argName;
var argItems;

while (args.length) {
  if (taskName) {
    break;
  }
  arg = args.shift();
  if (arg.indexOf('--') == 0) {
    argItems = arg.split('=');
    argName = optsReverseMap[argItems[0]];
    if (argName) {
      opts[argName] = argItems[1];
    }
    else {
      throw new Error('Unknown option "' + argItems[0] + '"');
    }
  }
  else if (arg.indexOf('-') == 0) {
    argName = optsReverseMap[arg];
    if (argName) {
      opts[argName] = args.shift();
    }
    else {
      throw new Error('Unknown option "' + arg + '"');
    }
  }
  else {
    taskName = arg;
  }
}

taskName = taskName || 'default';
opts.jakefile = opts.jakefile || './Jakefile';

if (opts.directory) {
  process.chdir(opts.directory);
}
var tasks = require(opts.jakefile).tasks;

var jake = new function () {
  this.runTask = function (name, args) {
    var task = tasks[name];
    var deps = task.deps;
    if (deps && deps instanceof Array) {
      for (var i = 0; i < deps.length; i++) {
        this.runTask.call(this, deps[i], args);
      }
    }
    task.task.call(task, this.processArgs(args));
  };

  this.processArgs = function (args) {
    var pat = /:|=/;
    var ret = {};
    var argItems;
    for (var i = 0; i < args.length; i++) {
      argItems = args[i].split(pat);
      ret[argItems[0]] = argItems[1];
    }
    return ret;
  };

}();

jake.runTask(taskName, args);
