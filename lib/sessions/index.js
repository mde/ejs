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
var Flash = require('./flash').Flash;

var session = new (function () {
  var KEY_LENGTH = 32;

  this.store = null;

  this.createStore = function (type, callback) {
    var key
      , constructor;

    if (type === 'mongo') {
      type = 'mongodb';
    }
    if (type === 'couch') {
      type = 'couchdb';
    }

    key = geddy.string.capitalize(type);
    constructor = require('./stores/' + type)[key];

    session.store = new constructor(callback);
  };

})();

session.Session = function (controller, callback) {
  var self = this
    , cookies = controller.cookies
    , keyName = geddy.config.sessions.key
    , sid = cookies.get(keyName);

  this.id = null;
  this.controller = controller;
  this.data = null;
  this.expires = this.controller.accessTime +
      (geddy.config.sessions.expiry * 1000);
  this.flash = null;

  this.setId(sid);

  setTimeout(function () {
    self.init(callback);
  }, 0);
};

session.Session.prototype = new function () {
  this.setId = function (s) {
    var sid = s || geddy.string.uuid(128)
      , cookies = this.controller.cookies
      , keyName = geddy.config.sessions.key
      , opts = {
          expires: (new Date(this.expires)).toGMTString()
        };

    cookies.set(keyName, sid, opts);
    this.id = sid;
  };

  this.init = function (appCallback) {
    var self = this;
    var localCallback = function (result) {
      self.data = result;
      if (self.isExpired()) {
        self.reset(appCallback);
      }
      else {
        self.flash = new Flash(self, geddy.config.flashes);
        appCallback();
      }
    };
    session.store.read(this, localCallback);
  };

  this.isExpired = function () {
    var expired = false
      , lastAccess = this.get('accessTime');
    if (lastAccess) {
      lastAccess = parseInt(lastAccess, 10);
      if (this.controller.accessTime >
        (lastAccess + this.expiry)) {
          expired = true;
        }
    }
    return expired;
  };

  this.reset = function (callback) {
    this.setId();
    this.data = {};
    this.flash = null;
    if (typeof callback == 'function') {
      callback();
    }
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
    this.flash.close();
    session.store.write(this, appCallback);
  };

}();


module.exports = session;
