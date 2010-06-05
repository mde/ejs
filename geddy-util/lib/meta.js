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
if (typeof geddy == 'undefined') { geddy = {}; geddy.util = {}; }

geddy.util.meta = new function () {
  this.registerConstructors = function (dirname, dirList) {
    
    if (typeof geddy.util.string == 'undefined') {
      if (typeof require != 'undefined') {
        geddy.util.string = require('geddy-util/lib/string');
      }
      else {
        throw new Error('This method depends on geddy.util.string');
      }
    }

    var fileName, constructorName;
    var constructors = {};
    var jsPat = /\.js$/;

    // Dynamically create constructor constructors from files in constructors/
    for (var i = 0; i < dirList.length; i++) {
      fileName = dirList[i];
      // Any files ending in '.js' -- e.g., 'neil_pearts.js'
      if (jsPat.test(fileName)) {
        // Strip the '.js', e.g., 'neil_pearts'
        fileName = fileName.replace(jsPat, '');
        // Convert underscores to camelCase with initial cap, e.g., 'NeilPearts'
        constructorName = geddy.util.string.camelize(fileName, true);
        // Registers as a constructor, e.g., constructors.NeilPearts =
        //    require('/path/to/geddy_app/<dirname>/neil_pearts').NeilPearts
        constructors[constructorName] = require(geddy.config.dirname +
            dirname + fileName)[constructorName];
      }
    }
    return constructors;
  };

  this.mixin = function (/* Target obj */ target,
    /* Obj of props or constructor */ mixin, /* Deep-copy flag */ recurse) {
    // Create an instance if we get a constructor
    var m;
    if (typeof mixin == 'function') {
      m = new mixin();
    }
    else {
      m = mixin;
    }
    var baseObj = {};
    for (var p in m) {
      // Don't copy anything from Object.prototype
      if (typeof baseObj[p] == 'undefined' || baseObj[p] != m[p]) {
        if (recurse && (typeof m[p] == 'object') && (m[p] !== null) &&
            !(m[p] instanceof Array)) {
          geddy.util.meta.mixin(target[p], m[p], recurse);
        }
        else {
          target[p] = m[p];
        }
      }
    }
    return target;
  };

}();

if (module) { module.exports = geddy.util.meta; }

