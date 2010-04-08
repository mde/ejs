var sys = require('sys');

var hooks = new function () {
  this.collection = {};
  
  this.registerHook = function (name, hook) {
    this.collection[name] = new hooks.Hook(name, hook);
  };

}();

hooks.Hook = function (name, params) {
  this.name = name;
  this.func = params.func;
  this.callback = params.callback;
}

for (var p in hooks) { this[p] = hooks[p]; }

