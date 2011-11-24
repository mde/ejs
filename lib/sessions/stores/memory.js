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

var Memory = function (callback) {
  this.setup(callback);
};

Memory.prototype = new (function () {
  var _sessions = {};

  this.setup = function (callback) {
    callback();
  };

  this.read = function (session, callback) {
    var sid = session.id;
    if (!_sessions[sid]) {
      _sessions[sid] = {};
    }
    callback(_sessions[sid]);
  };

  this.write = function (session, callback) {
    callback();
  };

})();

exports.Memory = Memory;

