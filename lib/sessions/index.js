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
var Flash = require('./flash').Flash
  , utils = require('utilities');

var session = new (function () {
  var KEY_LENGTH = 32;

  this.store = null;
  this.config = null;

  this.createStore = function (config, callback) {
    var type = config.sessions.store
      , key
      , constructor;

    this.config = config;

    // Normalize
    if (type === 'mongo') {
      type = 'mongodb';
    }
    if (type === 'couch') {
      type = 'couchdb';
    }

    key = utils.string.capitalize(type);
    constructor = require('./stores/' + type)[key];

    session.store = new constructor(callback);
  };

})();

session.Session = function (controller, callback) {
  var self = this
    , cookies = controller.cookies
    , keyName = session.config.sessions.key
    , sid = cookies.get(keyName);

  this.id = null;
  this.expiry = null;
  this.cookies = controller.cookies;
  this.accessTime = controller.accessTime;
  this.data = null;
  this.flash = null;

  this.setId(sid);
  this.setExpiry();

  setTimeout(function () {
    self.init(callback);
  }, 0);
};

session.Session.prototype = new function () {
  this.setId = function (s) {
    this.id = s || utils.string.uuid(128);
  };

  this.setExpiry = function (val) {
    this.expiry = typeof val == 'undefined' ?
        session.config.sessions.expiry * 1000 : val;
  };

  this.setKeyCookie = function () {
    var keyName = session.config.sessions.key
      , expr = utils.isEmpty(this.expiry) ? null :
            (new Date(this.accessTime + this.expiry)).toGMTString()
      , opts = {
          expiry: expr
        }
    this.cookies.set(keyName, this.id, opts);
  };

  this.init = function (appCallback) {
    var self = this;
    var localCallback = function (result) {
      self.data = result; // Access time is in the data
      if (self.isExpired()) {
        self.reset(appCallback);
      }
      else {
        self.flash = new Flash(self, session.config.flashes);
        appCallback();
      }
    };
    session.store.read(this, localCallback);
  };

  this.isExpired = function () {
    var expired = false
      , lastPersistedAccess = this.get('accessTime');
    if (!(utils.isEmpty(lastPersistedAccess) || utils.isEmpty(this.expiry))) {
      lastPersistedAccess = parseInt(lastPersistedAccess, 10);
      if (this.accessTime >
        (lastPersistedAccess + this.expiry)) {
          expired = true;
        }
    }
    return expired;
  };

  this.reset = function (callback) {
    this.setId();
    this.setExpiry();
    this.data = {};
    this.flash = new Flash(this, session.config.flashes);
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
    // Persist the access time to storage
    this.set('accessTime', this.accessTime);
    this.setKeyCookie();
    session.store.write(this, appCallback);
  };

  this.toJSON = function () {
    return utils.mixin({}, this.data);
  };

}();


module.exports = session;
