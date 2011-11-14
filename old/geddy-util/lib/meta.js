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
if (typeof geddy == 'undefined') { geddy = {}; } 
if (typeof geddy.util == 'undefined') { geddy.util = {}; }

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

  /*
   * Mix in the properties on an object to another object
   * geddy.util.mixin(target, source, [source,] [source, etc.] [merge-flag]);
   * 'merge' recurses, to merge object sub-properties together instead
   * of just overwriting with the source object.
   */
  this.mixin = (function () {  
    var _mix = function (targ, src, merge) {
      for (var p in src) {
        // Don't copy stuff from the prototype
        if (src.hasOwnProperty(p)) {
          if (merge &&
              // Assumes the source property is an Object you can
              // actually recurse down into
              (typeof src[p] == 'object') &&
              (src[p] !== null) &&
              !(src[p] instanceof Array)) {
            // Create the source property if it doesn't exist
            // TODO: What if it's something weird like a String or Number?
            if (typeof targ[p] == 'undefined') {
              targ[p] = {};
            }
            _mix(targ[p], src[p], merge); // Recurse
          }
          // If it's not a merge-copy, just set and forget
          else {
            targ[p] = src[p];
          }
        }
      }
    };

    return function () {
      var args = Array.prototype.slice.apply(arguments),
          merge = false,
          targ, sources;
      if (args.length > 2) {
        if (typeof args[args.length - 1] == 'boolean') {
          merge = args.pop();
        }
      }
      targ = args.shift();
      sources = args; 
      for (var i = 0, ii = sources.length; i < ii; i++) {
        _mix(targ, sources[i], merge);
      }
      return targ;
    };
  })();


}();

if (typeof module != 'undefined') { module.exports = geddy.util.meta; }

