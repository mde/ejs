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

var object = new (function () {

  this.merge = function(object, otherObject) {
    // Merges two objects together, then returns the final object
    // - if no matching value is found it will create a new one otherwise it will overwrite the old
    // - one, also supports deep merging automatically
    object = object || {};
    otherObject = otherObject || {};
    var i, key, value;

    for(i in otherObject) {
      key = i, value = otherObject[key];

      try {
        // If value is an object
        if(typeof value === 'object' && !value instanceof Array) {
          // Update value of object to the one from otherObject
          object[key] = merge(object[key], value);
        } else object[key] = value;
      } catch(err) {
        // Object isn't set so set it
        object[key] = value;
      }
    }
    return object;
  };

  this.reverseMerge = function(object, defaultObject) {
    // Same as `merge` except `defaultObject` is the object being changed
    // - this is useful if we want to easily deal with default object values
    return this.merge(defaultObject, object);
  };

  this.isEmpty = function(object) {
    // Returns true if a object is empty false if not
    for(var i in object) { return false; }
    return true;
  };

  this.toArray = function(object) {
    // Converts an object into an array of objects with the original key, values
    array = [];

    for(var i in object) {
      array.push({ key: i, value: object[i] });
    }

    return array;
  };

})();

exports.object = object;
