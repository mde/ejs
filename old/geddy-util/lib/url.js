/*
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

geddy.util.url = new function () {
  // Private vars
  var _this = this;
  var _QS = '\\?|;';
  var _QS_SIMPLE = new RegExp(_QS);
  var _QS_CAPTURE = new RegExp('(' + _QS + ')');

  // Private function, used by both getQSParam and setQSParam
  var _changeQS = function (mode, str, name, val) {
    var match = _QS_CAPTURE.exec(str);
    var delim;
    var base;
    var query;
    var obj;
    var s = '';
    // If there's a querystring delimiter, save it
    // for reinsertion into the return value
    if (match && match.length > 0) {
      delim = match[0];
    }
    // Delimiter -- entire URL, need to decompose
    if (delim) {
      base = _this.getBase(str);
      query = _this.getQS(str);
    }
    // Just a querystring passed
    else {
      query = str;
    }
    obj = _this.qsToObject(query, { arrayizeMulti: true });
    if (mode == 'set') { obj[name] = val; }
    else { delete obj[name]; }
    if (base) {
      s = base + delim;
    }
    s += _this.objectToQS(obj);
    return s;
  };
  /**
   * Convert the values in a query string (key=val&key=val) to
   * an Object
   * @param str -- A querystring
   * @param o -- JS object of options, current only includes:
   *   arrayizeMulti: (Boolean) convert mutliple instances of
   *      the same key into an array of values instead of
   *      overriding. Defaults to false.
   * @returns JavaScript key/val object with the values from
   * the querystring
   */
  this.qsToObject = function (str, o) {
    var opts = o || {};
    var d = {};
    var arrayizeMulti = opts.arrayizeMulti || false;
    if (str) {
      var arr = str.split('&');
      for (var i = 0; i < arr.length; i++) {
        var pair = arr[i].split('=');
        var name = pair[0];
        var val = decodeURIComponent(pair[1]);
        // "We've already got one!" -- arrayize if the flag
        // is set
        if (typeof d[name] != 'undefined' && arrayizeMulti) {
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
  /**
   * Convert a JS Object to querystring (key=val&key=val).
   * Value in arrays will be added as multiple parameters
   * @param obj -- an Object containing only scalars and arrays
   * @param o -- JS object of options for how to urlat
   * the return string. Supported options:
   *   collapseMulti: (Boolean) take values from elements that
   *      can return multiple values (multi-select, checkbox groups)
   *      and collapse into a single, comman-delimited value
   *      (e.g., thisVar=asdf,qwer,zxcv)
   *   stripTags: (Boolean) strip markup tags from any values
   *   includeEmpty: (Boolean) include keys in the string for
   *     all elements, even if they have no value set (e.g.,
   *     even if elemB has no value: elemA=foo&elemB=&elemC=bar)
   *   pedantic: (Boolean) include the values of elements like
   *      button or image
   *   deCamelizeParams: (Boolean) change param names from
   *     camelCase to lowercase_with_underscores
   * @returns A querystring containing the values in the
   * Object
   * NOTE: This is used by url.serialize
   */
  this.objectToQS = function (obj, o) {
    var opts = o || {};
    var str = '';
    var pat = opts.stripTags ? /<[^>]*>/g : null;
    for (var n in obj) {
      var s = '';
      var v = obj[n];
      if (v != undefined) {
        // Multiple vals -- array
        if (v.length && typeof v != 'string') {
          var sep = '';
          if (opts.collapseMulti) {
            sep = ',';
            str += n + '=';
          }
          else {
            sep = '&';
          }
          for (var j = 0; j < v.length; j++) {
            s = opts.stripTags ? v[j].replace(pat, '') : v[j];
            s = (!opts.collapseMulti) ? n + '=' + encodeURIComponent(s) :
              encodeURIComponent(s);
            str += s + sep;
          }
          str = str.substr(0, str.length - 1);
        }
        // Single val -- string
        else {
          s = opts.stripTags ? v.replace(pat, '') : v;
          str += n + '=' + encodeURIComponent(s);
        }
        str += '&';
      }
      else {
        if (opts.includeEmpty) { str += n + '=&'; }
      }
    }
    // Convert all the camelCase param names to Ruby/Python style
    // lowercase_with_underscores
    if (opts.deCamelizeParams) {
      if (!fleegix.string) {
        throw new Error(
          'deCamelize option depends on fleegix.string module.');
      }
      var arr = str.split('&');
      var arrItems;
      str = '';
      for (var i = 0; i < arr.length; i++) {
        arrItems = arr[i].split('=');
        if (arrItems[0]) {
          str += fleegix.string.deCamelize(arrItems[0]) +
            '=' + arrItems[1] + '&';
        }
      }
    }
    str = str.substr(0, str.length - 1);
    return str;
  };
  this.objectToQs = this.objectToQS; // Case-insensitive alias
  /**
   * Retrieve the value of a parameter from a querystring
   * @param str -- Either a querystring or an entire URL
   * @param name -- The param to retrieve the value for
   * @param o -- JS object of options, current only includes:
   *   arrayizeMulti: (Boolean) convert mutliple instances of
   *      the same key into an array of values instead of
   *      overriding. Defaults to false.
   * @returns The string value of the specified param from
   * the querystring
   */
  this.getQSParam = function (str, name, o) {
    var p = null;
    var q = _QS_SIMPLE.test(str) ? _this.getQS(str) : str;
    var opts = o || {};
    if (q) {
      var h = _this.qsToObject(q, opts);
      p = h[name];
    }
    return p;
  };
  this.getQsParam = this.getQSParam; // Case-insensitive alias
  /**
   * Set the value of a parameter in a querystring
   * @param str -- Either a querystring or an entire URL
   * @param name -- The param to set
   * @param val -- The value to set the param to
   * @returns  the URL or querystring, with the new value
   * set -- if the param was not originally there, it adds it.
   */
  this.setQSParam = function (str, name, val) {
    return _changeQS('set', str, name, val);
  };
  this.setQsParam = this.setQSParam; // Case-insensitive alias
  /**
   * Remove a parameter in a querystring
   * @param str -- Either a querystring or an entire URL
   * @param name -- The param to remove
   * @returns  the URL or querystring, with the parameter
   * removed
   */
  this.removeQSParam = function (str, name) {
    return _changeQS('remove', str, name, null);
  };
  this.removeQsParam = this.removeQSParam; // Case-insensitive alias
  this.getQS = function (s) {
    return s.split(_QS_SIMPLE)[1];
  };
  this.getQs = this.getQS; // Case-insensitive alias
  this.getBase = function (s) {
    return s.split(_QS_SIMPLE)[0];
  };
}();

if (typeof exports != 'undefined') {
  for (var p in geddy.util.url) { exports[p] = geddy.util.url[p]; }
}



