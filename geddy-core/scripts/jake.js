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
var passArgs = [];
var passOpts = {};
var pat = /:|=/;
var hasOpts = false;

while (args.length) {
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
    if (!taskName) {
      taskName = arg;
    }
    else {
      if (/:|=/.test(arg)) {
        hasOpts = true;
        argItems = arg.split(pat);
        passOpts[argItems[0]] = argItems[1];
      }
      else {
        passArgs.push(arg);
      }
    }
  }
}

if (hasOpts) {
  passArgs.push(passOpts);
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
    if (!task) {
      throw new Error('Task "' + name + '" is not defined in the Jakefile.');
    }
    var deps = task.deps;
    if (deps && deps instanceof Array) {
      for (var i = 0; i < deps.length; i++) {
        this.runTask.call(this, deps[i], args);
      }
    }
    task.task.apply(task, passArgs);
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
