var sys = require('sys');

var fleegix = require('geddy/lib/fleegix');
var async = require('geddy/lib/async');

var auth = new function () {
}();

auth.Auth = function (config) {
  var _this = this;
  this.authTypes = config;
  this.authenticators = {};

  this.requireAuth = function (controller, handleAuth) {
    var list = [];
    var types = _this.authTypes;
    var name;
    var getFunc = function (n) {
      return _this.authenticators[n].authenticate;
    };
    for (var i = 0; i < types.length; i++) {
      name = types[i];
      list.push(
        {
          func: getFunc(name),
          args: [controller],
          callback: function (isAuthed) {
            if (isAuthed) {
              arguments.callee.chain.shortCircuit(true);
            }
          },
        }
      );
    }
    var chain = new async.AsyncChain(list);
    chain.last = handleAuth;
    chain.run();
  };

  var types = this.authTypes;
  var pathName;
  var constructorName;
  var constructor;
  for (var i = 0; i < types.length; i++) {
    constructorName = types[i];
    pathName = fleegix.string.deCamelize(constructorName);
    constructor = require(__dirname + '/auth_types/' + pathName)[constructorName];
    this.authenticators[constructorName] = new constructor();
  }


  hooks.registerHook('requireAuth', {func: this.requireAuth});
};

exports.Auth = auth.Auth;
