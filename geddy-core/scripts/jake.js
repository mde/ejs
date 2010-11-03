/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

var JAKE_VERSION = '0.1.0';
var args = process.argv.slice(2);
var util = require('util');

var parseopts = new function () {
  var optsReg = {
    directory: ['-C', '--directory']
    , jakefile: ['-f', '--file']
    , version: [null, '--version']
  };

  this.parse = function (args) {
    var cmds = [];
    var opts = {};
    var optsReverseMap = {};
    var optsItem;
    var arg;
    var argName;
    var argItems;

    for (var p in optsReg) {
      optsItem = optsReg[p];
      for (var i = 0; i < optsItem.length; i++) {
        optsReverseMap[optsItem[i]] = p;
      }
    }

    while (args.length) {
      arg = args.shift();
      if (arg.indexOf('--') == 0) {
        argItems = arg.split('=');
        argName = optsReverseMap[argItems[0]];
        if (argName) {
          // If there's no attached value, value is null
          opts[argName] = argItems[1] || null;
        }
        else {
          throw new Error('Unknown option "' + argItems[0] + '"');
        }
      }
      else if (arg.indexOf('-') == 0) {
        argName = optsReverseMap[arg];
        if (argName) {
          // If there is no following item, or the next item is
          // another opt, value is null
          opts[argName] = (!args[0] || (args[0].indexOf('-') == 0)) ?
              null : args.shift();
        }
        else {
          throw new Error('Unknown option "' + arg + '"');
        }
      }
      else {
        cmds.push(arg);
      }
    }
    
    return {cmds: cmds, opts: opts};
  };

};

var parsed = parseopts.parse(args);
var opts = parsed.opts;
var cmds = parsed.cmds;
var taskName = cmds.shift();
var jakefile;

taskName = taskName || 'default';
jakefile = opts.jakefile ?
    opts.jakefile.replace(/\.js$/, '') : './Jakefile';

var jake = new function () {
  this.currentNamespace = 'default';
  this.currentTaskDescription = null;
  this.namespaceTasks = {
    'default': {}
  };
  this.runTask = function (name, args) {
    var nameArr = name.split(':');
    var nsName, taskName;
    if (nameArr.length > 1) {
      nsName = nameArr[0];
      taskName = nameArr[1];
    }
    else {
      nsName = 'default';
      taskName = name;
    }
    var task = this.namespaceTasks[nsName][taskName];
    if (!task) {
      throw new Error('Task "' + name + '" is not defined in the Jakefile.');
    }
    var deps = task.deps;
    if (deps && deps instanceof Array) {
      for (var i = 0; i < deps.length; i++) {
        this.runTask.call(this, deps[i], args);
      }
    }
    var parsed = this.parseArgs(args);
    var passArgs = parsed.cmds.concat(parsed.opts);
    task.handler.apply(task, passArgs);
  };

  this.parseArgs = function (args) {
    var cmds = [];
    var opts = {};
    var pat = /:|=/;
    var argItems;
    for (var i = 0; i < args.length; i++) {
      argItems = args[i].split(pat);
      if (argItems.length > 1) {
        opts[argItems[0]] = argItems[1];
      }
      else {
        cmds.push(args[i]);
      }
    }
    return {cmds: cmds, opts: opts}; 
  };

}();

jake.Task = function (name, deps, handler) {
  this.name = name,
  this.deps = deps,
  this.handler = handler;
  this.desription = null;
};

global.task = function (name, deps, handler) {
  var task = new jake.Task(name, deps, handler);
  if (jake.currentTaskDescription) {
    task.description = jake.currentTaskDescription;
    jake.currentTaskDescription = null;
  }
  jake.namespaceTasks[jake.currentNamespace][name] = task;
};

global.desc = function (str) {
  jake.currentTaskDescription = str;
};

global.namespace = function (name, tasks) {
  if (typeof jake.namespaceTasks[name] == 'undefined') {
    jake.namespaceTasks[name] = {};
  }
  jake.currentNamespace = name;
  tasks();
  jake.currentNamespace = 'default';
};

if (typeof opts.version != 'undefined') {
  util.puts(JAKE_VERSION);
  process.exit();
}

var tasks = require(jakefile);

if (opts.directory) {
  process.chdir(opts.directory);
}


jake.runTask(taskName, cmds);

