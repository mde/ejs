var sys = require('sys');

var fleegix = require('geddy/lib/fleegix');
var async = require('geddy/lib/async');
var errors = require('geddy/lib/errors');
var response = require('geddy/lib/response');

var auth = new function () {
}();

auth.Auth = function (config) {
  var _this = this;
  this.authTypes = config;
  this.authenticators = {};
  this.controller = null;

  this.requireAuth = function (controller, handleAuth) {
    var authed = false;
    var list = [];
    var types = _this.authTypes;
    var name;
    var getFunc = function (n) {
      return _this.authenticators[n].authenticate;
    };

    _this.controller = controller;

    for (var i = 0; i < types.length; i++) {
      name = types[i];
      list.push(
        {
          func: getFunc(name),
          args: [controller],
          callback: function (isAuthed) {
            if (isAuthed) {
              sys.puts('isAuthed');
              sys.puts(isAuthed);
              authed = true;
              arguments.callee.chain.shortCircuit(true);
            }
          },
        }
      );
    }
    var chain = new async.AsyncChain(list);
    chain.last = function () { handleAuth(authed); };
    chain.run();
  };

  this.handleAuth = function (isAuthed) {
    if (!isAuthed) {
      var e = new errors.UnauthorizedError('Authentication required.');
      var r = new response.Response(_this.controller.response);
      r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
      arguments.callee.chain.abort();
    }
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


  var hookData = {
    func: this.requireAuth,
    callback: this.handleAuth
  };
  sys.puts('registering requireAuth');
  hooks.registerHook('requireAuth', hookData);
};

exports.Auth = auth.Auth;
