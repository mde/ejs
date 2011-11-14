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

var Cookie = function (callback) {
  this.setup(callback);
};

Cookie.prototype = new (function () {
  this.setup = function (callback) {
    callback();
  };

  this.read = function (session, callback) {
    var controller = session.controller
      , data = controller.cookies.get(geddy.config.cookieSessionKey);
    data = data ? JSON.parse(data) : {};
    callback(data);
  };

  this.write = function (session, callback) {
    var controller = session.controller
      , data = JSON.stringify(session.data);
    controller.cookies.set(geddy.config.cookieSessionKey, data);
    callback();
  };

})();

exports.Cookie = Cookie;


