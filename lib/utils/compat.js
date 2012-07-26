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

var fs = require('fs')
  , path = require('path');

var compat = new (function() {

  // Compatibility for fs.exists(0.8) and path.exists(0.6)
  this.exists = (typeof fs.exists === 'function') ? fs.exists : path.exists;

  // Compatibility for fs.existsSync(0.8) and path.existsSync(0.6)
  this.existsSync = (typeof fs.existsSync === 'function') ? fs.existsSync : path.existsSync;

  // Used to require external dependencies(Either globally or locally in users application)
  this.dependency = function(module, message) {
    var dep;

    try {
      // Try to require globally
      dep = require(module);
    } catch(err) {
      // Try to require in the application directory
      try {
        // This is the main reason this method is created, if we try to do a regular require
        // - to find a local package it assume it'll be in Geddy's node_modules instead of
        // - the application
        dep = require(path.join(process.cwd(), 'node_modules', module));
      } catch(err) {
        if(message) {
          throw new Error(message);
        }
        throw new Error('Module "' + module + '" could not be found please install it by doing "npm install ' + module + '"');
      }
    }
    return dep;
  };

})();


exports.compat = compat;
