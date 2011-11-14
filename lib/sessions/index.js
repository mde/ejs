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

var session = new (function () {
  var KEY_LENGTH = 32;

  this.store = null;

  this.generateSessionId = function () {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    var len = KEY_LENGTH;
    var str = '';
    var mls = new Date().getTime();
    for (var i = 0; i < len; i++) {
      var rnum = (Math.random() * chars.length);
      rnum = Math.floor(rnum);
      str += chars.substring(rnum, rnum + 1);
    }
    return str;
  };

  this.createStore = function (type, callback) {
    var key = geddy.string.capitalize(type);
    var constructor = require('./stores/' + type)[key];
    session.store = new constructor(callback);
  };

})();

session.Session = function (controller, callback) {
  var self = this
    , cookies = controller.cookies
    , keyName = geddy.config.sessions.key
    , sid = cookies.get(keyName);

  if (!sid) {
    sid = session.generateSessionId()
    var dt = new Date();
    dt.setTime(dt.getTime() + (geddy.config.sessions.expiry * 1000));
    cookies.set(keyName, sid, {expires: dt.toGMTString()});
  }

  this.sid = sid;
  this.controller = controller;
  this.data = null;

  setTimeout(function () {
    self.init(callback);
  }, 0);
};

session.Session.prototype = new function () {
  this.init = function(appCallback) {
    var _this = this;
    var localCallback = function (result) {
      _this.data = result;
      appCallback();
    };
    session.store.read(this, localCallback);
  };

  this.get = function (key) {
    return this.data[key];
  };

  this.set = function (key, val) {
    this.data[key] = val;
  };

  this.unset = function (key) {
    delete this.data[key];
  };

  this.close = function (appCallback) {
    session.store.write(this, appCallback);
  };

}();

module.exports = session;
