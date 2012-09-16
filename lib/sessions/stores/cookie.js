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
var crypto = require('crypto')
  , Cookie;

Cookie = function (callback) {
  this.setup(callback);
};

Cookie.prototype = new (function () {
  this.setup = function (callback) {
    callback();
  };

  this.read = function (session, callback) {
    var controller = session.controller
      , secret = geddy.config.secret
      , crypted = controller.cookies.get(geddy.config.cookieSessionKey)
      , decipher
      , data = {};

    if (!secret) {
      throw new Error ('No app-secret found. Must run "geddy secret".');
    }

    if (crypted) {
      decipher = crypto.createDecipher('aes-256-cbc', secret +
          this.id);
      data = decipher.update(crypted, 'hex', 'utf8');
      try {
        data += decipher.final('utf8');
        try {
          data = JSON.parse(data);
        }
        catch (e) {}
      }
      catch (e) {}
    }

    callback(data);
  };

  this.write = function (session, callback) {
    var controller = session.controller
      , secret = geddy.config.secret
      , data = JSON.stringify(session.data)
      , cipher
      , crypted
      , opts = {
          expires: (new Date(session.expires)).toGMTString()
        };

    if (!secret) {
      throw new Error ('No app-secret found. Must run "geddy secret".');
    }

    cipher = crypto.createCipher('aes-256-cbc', secret +
        this.id);
    crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');

    controller.cookies.set(geddy.config.cookieSessionKey, crypted, opts);
    callback();
  };

})();

exports.Cookie = Cookie;


