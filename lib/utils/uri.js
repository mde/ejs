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
 t
*/
var uri = new (function () {
  var _isArray = function (obj) {
    return obj &&
      typeof obj === 'object' &&
      typeof obj.length === 'number' &&
      typeof obj.splice === 'function' &&
      !(obj.propertyIsEnumerable('length'));
  };

  this.getFileExtension = function (path) {
    var match;
    if (path) {
      match = /.+\.(\w{2,4}$)/.exec(path);
    }
    return (match && match[1]) || '';
  };

  /**
   * Convert a JS Object to querystring (key=val&key=val).
   * Value in arrays will be added as multiple parameters
   * @param obj -- an Object containing only scalars and arrays
   * @param o -- JS object of options for how to format
   * the return string. Supported options:
   *   consolidate: (Boolean) take values from elements that
   *      can return multiple values (multi-select, checkbox groups)
   *      and collapse into a single, comman-delimited value.
   *      Defaults to false.
   *      (e.g., thisVar=asdf,qwer,zxcv)
   *   includeEmpty: (Boolean) include keys in the string for
   *      all elements, even if they have no value set (e.g.,
   *      even if elemB has no value: elemA=foo&elemB=&elemC=bar).
   *      Defaults to false. Note that some false-y values are always
   *      valid even without this option, [0, '']. This option extends
   *      coverage to [null, undefined, NaN]
   *   snakeize: (Boolean) change param names from
   *      camelCase to snake_case. Defaults to false.
   *   escapeVals: (Boolean) escape the values for XML entities.
   *      Defaults to false.
   * @returns A querystring containing the values in the
   * Object
   */
  this.paramify = function (obj, o) {
    var opts = o || {},
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
  this.objectify = function (str, o) {
    var opts = o || {};
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

