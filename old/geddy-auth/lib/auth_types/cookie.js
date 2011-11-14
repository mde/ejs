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

var Cookie = function () {
  this.authenticate =  function(controller, callback) {
    // The key to look for in the session to indicate logged-in status
    var key = geddy.config.plugins.Auth.authedSessionKey || 'login';
    // Check for the existence of a login ID in the session
    var authed = !!controller.session.get(key);
    callback(authed);
  };
};

exports.Cookie = Cookie;
