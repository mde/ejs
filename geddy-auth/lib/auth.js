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

var sys = require('sys');

var fleegix = require('geddy-core/lib/fleegix');
var errors = require('geddy-core/lib/errors');
var response = require('geddy-core/lib/response');
var async = require('geddy-util/lib/async');

var auth = {};

auth.Auth = function (config) {
  var _this = this;
  this.authTypes = config.authTypes;
  this.htmlRedirect = config.htmlRedirect || '/';
  this.authenticators = {};
  this.controller = null;

  this.func = function (controller, callback) {
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
      list.push({
          func: getFunc(name),
          args: [controller],
          callback: function (isAuthed) {
            if (isAuthed) {
              authed = true;
              arguments.callee.chain.shortCircuit(true);
            }
          },
        });
    }
    var chain = new async.AsyncChain(list);
    chain.last = function () {
      callback(authed);
    };
    chain.run();
  };

  this.callback = function (isAuthed) {
    if (!isAuthed) {
      arguments.callee.chain.abort();
      var params = _this.controller.params;
      var r = new response.Response(_this.controller.response);
      if (params.extension == 'html') {
        _this.controller.redirect(_this.htmlRedirect);
      }
      else {
        var e = new errors.UnauthorizedError('Authentication required.');
        r = new response.Response(_this.controller.response);
        r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
      }
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

  var hookCall = new async.AsyncCall(this.func, null, this.callback);
  
  hooks.registerHook('requireAuth', hookCall);
};

exports.Auth = auth.Auth;
