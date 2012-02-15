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
var geddy
  , string = require('./string').string
  , async = require('./async').async
  , uri = require('./uri').uri
  , date = require('./date').date
  , request = require('./request').request
  , EventBuffer = require('./event_buffer').EventBuffer
  , XML = require('./xml').XML
  , SortedCollection = require('./sorted_collection').SortedCollection;

var utils = new (function () {

  var _mix = function (targ, src, merge, includeProto) {
    for (var p in src) {
      // Don't copy stuff from the prototype
      if (src.hasOwnProperty(p) || includeProto) {
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
          _mix(targ[p], src[p], merge, includeProto); // Recurse
        }
        // If it's not a merge-copy, just set and forget
        else {
          targ[p] = src[p];
        }
      }
    }
  };

  this.objectToString = function (object) {
    var objectArray = [];
    for (var key in object) {
      if ('object' == typeof object[key]) {
        objectArray.push(this.objectToString(object[key]));
      } else {
        objectArray.push(key + '=' + object[key]);
      }
    }
    return objectArray.join(', ');
  };

  /*
   * Mix in the properties on an object to another object
   * yam.mixin(target, source, [source,] [source, etc.] [merge-flag]);
   * 'merge' recurses, to merge object sub-properties together instead
   * of just overwriting with the source object.
   */
  this.mixin = (function () {
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
  }).call(this);

  this.enhance = (function () {
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
        _mix(targ, sources[i], merge, true);
      }
      return targ;
    };
  }).call(this);

})();

utils.string = string;
utils.async = async;
utils.uri = uri;
utils.date = date;
utils.request = request;
utils.SortedCollection = SortedCollection;
utils.EventBuffer = EventBuffer;
utils.XML = XML;

module.exports = utils;

