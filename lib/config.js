var fs = require('fs');
var child_process = require('child_process');
var fleegix = require('geddy/lib/fleegix');
var sys = require('sys');

var environments = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
};

var Config = function (dirname, callback) {
  var _this = this;
  this.callback = callback;
  this.environment = environments.DEVELOPMENT;
  this.dirname = dirname;
  this.router = require(this.dirname + '/config/router').router;
  this.staticFilePath = this.dirname + '/public';
  this.controllers = {};
  this.templates = {};
  

  this.createControllers = function (err, dirList) {
    var fileName, controllerName;
    var controllers = {};
    var jsPat = /\.js$/;

    // Dynamically create controller constructors from files in controllers/
    for (var i = 0; i < dirList.length; i++) {
      fileName = dirList[i];
      // Any files ending in '.js' -- e.g., 'neil_pearts.js'
      if (jsPat.test(fileName)) {
        // Strip the '.js', e.g., 'neil_pearts'
        fileName = fileName.replace(jsPat, '');
        // Convert underscores to camelCase, e.g., 'neilPearts'
        controllerName = fleegix.string.camelize(fileName);
        // Capitalize the first letter, e.g., 'NeilPearts'
        controllerName = fleegix.string.capitalize(controllerName);
        // Registers as a controller, e.g., controllers.NeilPearts =
        //    require('/path/to/geddy_app/app/controllers/neil_pearts').NeilPearts
        controllers[controllerName] = require(_this.dirname +
            '/app/controllers/' + fileName)[controllerName];
      }
    }
    _this.controllers = controllers;
  };

  this.createTemplates = function (err, stdin, stderr) {
    if (err) {
      sys.puts('Error: ' + JSON.stringify(err));
    }
    else if (stderr) {
      sys.puts('Error: ' + stderr);
    }
    else {
      var templates = {};
      var files = stdin.split('\n');
      var file;
      var pat = /\.ejs$/;
      for (var i = 0; i < files.length; i++) {
        file = files[i];
        if (pat.test(file)) {
          file = file.replace(_this.dirname + '/', '');
          templates[file] = true;
        }
      }
      _this.templates = templates;
    }
  };
 
  var cmdList = [
    {
      func: fs.readdir,
      args: [this.dirname + '/app/controllers'],
      callback: this.createControllers
    },
    {
      func: child_process.exec,
      args: ['find ' + this.dirname + '/app/views'],
      callback: this.createTemplates
    }
  ];
  
  var chain = new async.AsyncChain(cmdList);
  chain.last = function () {
    _this.callback(_this);
  };
  chain.run();
}

var async = {};
async.AsyncChain = function (chain) {
  this.chain = [];
  var item;
  for (var i = 0; i < chain.length; i++) {
    item = chain[i];
    this.chain.push(new async.AsyncCall(
        this, item.func, item.args, item.callback));
  }
};

async.AsyncChain.prototype = new function () {
  this.runItem = function (item) {
    var args = item.args.concat(item.callback);
    item.func.apply(null, args);
  };
  this.next = function () {
    if (this.chain.length) {
      this.runItem(this.chain.shift());
    }
    else {
      this.last();
    }
  };
  this.run = this.next;
  this.last = function () {};
}();

async.AsyncCall = function (chain, func, args, callback) {
  this.func = func;
  this.args = args;
  this.callback = function () {
    callback.apply(null, arguments);
    chain.next();
  };
};

exports.Config = Config;
exports.environments = environments;
