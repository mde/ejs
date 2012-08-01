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

var extname = require('path').extname
  , uri;

uri = new (function () {

  // Check if an item is an Array
  var _isArray = function(obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  /*
   * getFileExtension(path<String>)
   *
   * Return a paths extension
   *
   * Examples:
   *   getFileExtension('users.json')
   *   => 'json'
  */
  this.getFileExtension = function(path) {
    if(!path) {
      return;
    }

    var ext = extname(path);

    return ext.replace('.', '');
  };

  /*
   * paramify(obj<Object>, options<Object>)
   *
   * Convert a JS Object to querystring (key=val&key=val)
   * Value in arrays will be added as multiple parameters
   *
   * Options:
   *   consolidate <Boolean>  Take values from elements that can return multiple
   *                          values(multi-select, checkbox groups) and collapse
   *                          into single, comma-delimited value(Default: false)
   *   includeEmpty <Boolean> Include keys in the string for all elements, even if
   *                          they have no value set, doesn't include 0 and ''
   *                          (Default: false)
   *   snakeize <Boolean>     Change params names from camelCase to snake_case(Default: false)
   *   escapeVals <Boolean>   Escape values for XML entities(Default: false)
   *
   * Examples:
   *   paramify({name: 'user'})
   *   => 'name=user'
   *
   *   paramify({name: ['user', 'user2']}, {consolidate: true})
   *   => 'name=user&name=user2'
   *
   *   paramify({name: ''}, {includeEmpty: true})
   *   => 'name='
   *
   *   paramify({authToken: 'token'}, {snakeize: true})
   *   => 'auth_token=token'
   *
   *   paramify({name: '<'}, {esapeVals: true})
   *   => 'name=%26lt%3B'
  */
  this.paramify = function(obj, options) {
    var opts = options || {},
        str = '',
        key,
        val,
        isValid,
        itemArray,
        arr = [],
        arrVal;

    for (var p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        val = obj[p];

        // This keeps valid falsy values like false and 0
        // It's duplicated in the array block below. Could
        // put it in a function but don't want the overhead
        isValid = !( val === null || val === undefined ||
                    (typeof val === 'number' && isNaN(val)) );

        key = opts.snakeize ? geddy.string.snakeize(p) : p;
        if (isValid) {
          // Multiple vals -- array
          if (_isArray(val) && val.length) {
            itemArray = [];
            for (var i = 0, ii = val.length; i < ii; i++) {
              arrVal = val[i];
              // This keeps valid falsy values like false and 0
              isValid = !( arrVal === null || arrVal === undefined ||
                           (typeof arrVal === 'number' && isNaN(arrVal)) );

              itemArray[i] = isValid ? encodeURIComponent(arrVal) : '';
              if (opts.escapeVals) {
                itemArray[i] = geddy.string.escapeXML(itemArray[i]);
              }
            }
            // Consolidation mode -- single value joined on comma
            if (opts.consolidate) {
              arr.push(key + '=' + itemArray.join(','));
            }
            // Normal mode -- multiple, same-named params with each val
            else {
              // {foo: [1, 2, 3]} => 'foo=1&foo=2&foo=3'
              // Add into results array, as this just ends up getting
              // joined on ampersand at the end anyhow
              arr.push(key + '=' + itemArray.join('&' + key + '='));
            }
          }
          // Single val -- string
          else {
            if (opts.escapeVals) {
              val = geddy.string.escapeXML(val);
            }
            arr.push(key + '=' + encodeURIComponent(val));
          }
          str += '&';
        }
        else {
          if (opts.includeEmpty) { arr.push(key + '='); }
        }
      }
    }
    return arr.join('&');
  };

  /**
   * Convert the values in a query string (key=val&key=val) to
   * an Object
   * @param str -- A querystring
   * @param o -- JS object of options, currently:
   *   consolidate: (Boolean) convert mutliple instances of
   *      the same key into an array of values instead of
   *      overwriting. Defaults to true.
   * @returns JavaScript key/val object with the values from
   * the querystring
   */


  /*
   * objectify(str<String>, options<Object>)
   *
   * Converts a query string into an Object
   *
   * Options:
   *   consolidate <Boolean> Converts multiple instances of the same key
   *                         into an array of values(Default: true)
   *
   * Examples:
   *   objectify('name=user')
   *   => {name: 'user'}
   *
   *   objectify('name=user&name=user2')
   *   => {name: ['user', 'user2']}
   *
   *   objectify('name=user&name=user2', {consolidate: false})
   *   => {name: 'user2'}
  */
  this.objectify = function (str, options) {
    var opts = options || {};
    var d = {};
    var consolidate = typeof opts.consolidate == 'undefined' ?
        true : opts.consolidate;
    if (str) {
      var arr = str.split('&');
      for (var i = 0; i < arr.length; i++) {
        var pair = arr[i].split('=');
        var name = pair[0];
        var val = decodeURIComponent(pair[1] || '');
        // "We've already got one!" -- arrayize if the flag
        // is set
        if (typeof d[name] != 'undefined' && consolidate) {
          if (typeof d[name] == 'string') {
            d[name] = [d[name]];
          }
          d[name].push(val);
        }
        // Otherwise just set the value
        else {
          d[name] = val;
        }
      }
    }
    return d;
  };

})();

exports.uri = uri;

