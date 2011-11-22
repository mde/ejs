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
var string = new (function () {
  // Regexes used in trimming functions
  var _LTR = /^\s+/;
  var _RTR = /\s+$/;
  var _TR = /^\s+|\s+$/g;
  var _NL = /\n|\r|\r\n/g;
  // From/to char mappings -- for the XML escape,
  // unescape, and test for escapable chars
  var _CHARS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  };
  var _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  // Builds the escape/unescape methods using a common
  // map of characters
  var _buildEscapes = function (direction) {
    return function (str) {
      s = str;
      var fr, to;
      for (var p in _CHARS) {
        fr = direction == 'to' ? p : _CHARS[p];
        to = direction == 'to' ? _CHARS[p] : p;
        s = s.replace(new RegExp(fr, 'gm'), to);
      }
      return s;
    };
  };
  // Builds a method that tests for any of the escapable
  // characters -- useful for avoiding double-escaping if
  // you're not sure whether a string is already escaped
  var _buildEscapeTest = function (direction) {
    return function (s) {
      var pat = '';
      for (var p in _CHARS) {
        pat += direction == 'to' ? p : _CHARS[p];
        pat += '|';
      }
      pat = pat.substr(0, pat.length - 1);
      pat = new RegExp(pat, "gm");
      return pat.test(s);
    };
  };

  // Escape special chars to entities
  this.escapeXML = _buildEscapes('to');

  // Unescape entities to special chars
  this.unescapeXML = _buildEscapes('from');

  // Test if a string includes special chars that
  // require escaping
  this.needsEscape = _buildEscapeTest('to');

  this.needsUnescape = _buildEscapeTest('from');

  this.toArray = function (str) {
    var arr = [];
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.substr(i, 1);
    }
    return arr;
  };

  this.reverse = function (str) {
    return this.toArray(str).reverse().join('');
  };

  this.ltrim = function (str, chr) {
    var pat = chr ? new RegExp('^' + chr + '+') : _LTR;
    return str.replace(pat, '');
  };

  this.rtrim = function (str, chr) {
    var pat = chr ? new RegExp(chr + '+$') : _RTR;
    return str.replace(pat, '');
  };

  this.trim = function (str, chr) {
    var pat = chr ? new RegExp('^' + chr + '+|' + chr + '+$', 'g') : _TR;
    return str.replace(pat, '');
  };

  this.lpad = function (str, chr, width) {
    var s = str;
    while (s.length < width) {
      s = chr + s;
    }
    return s;
  };

  this.rpad = function (str, chr, width) {
    var s = str;
    while (s.length < width) {
      s = s + chr;
    }
    return s;
  };

  this.truncate = function (s, limit, o) {
    var opts = o || {};
    if (s.length <= limit || (opts.max && s.length <= opts.max)) {
      return s;
    }
    var str = '';
    if (opts.file) {
      str = s.substring(0, limit - (limit / 2));
      str += opts.truncationChar || '&hellip;'
      str += s.substring(s.length, s.length - (limit / 2));
    } else {
      if (opts.truncateOnWords) {
        str = s.substring(0, limit).replace(/\s\S+$|\s$/, '');
      } else {
        str = s.substring(0, limit);
      };
      str += opts.truncationChar || '&hellip;';
    }
    return str
  }

  this.truncateHTML = function (str, len, tail) {
    // The returned string of content
    var s = '';
    // Any tail to append after truncation -- e.g. ellipses
    var t = tail || '';
    // Split pattern for HTML tags
    var pat = /(<[^>]*>)/;
    // Opening HTML tag -- used as a flag that there's an
    // HTML tag sitting open when truncation happens
    var openTag = null;
    // Used to close any open tag
    var closeTag = '';
    // An array of merged content and tags, e.g., ['foo',
    // '<strong>', 'bar', '</strong>']
    var arr = [];
    // Current length of the string to return
    var currLen = 0;
    // Lookahead to see if we'll overshoot the max length
    var nextLen = 0;
    // Truncated final segment of the string
    var trunc;
    // Each item in the merged tag/content array
    var item;

    // Build the merged array of tags/content
    var result = pat.exec(str);
    while (result) {
      var firstPos = result.index;
      var lastPos = pat.lastIndex;
      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }
      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }
    if (str !== '') {
      arr.push(str);
    }

    // Parse each item in the tag/content array
    // Have to parse in all cases -- no simple test to see
    // if you can just return the entire string
    // Global regex replace would work, but who knows
    // how much if any faster that is
    for (var i = 0; i < arr.length; i++) {
      item = arr[i];
      switch (true) {
        // Closing tag
        case item.indexOf('</') == 0:
          s += item;
          openTag = null;
          break;
        // Opening tag
        case item.indexOf('<') == 0:
          s += item;
          openTag = item;
          break;
        // Text
        default:
          nextLen += item.length;
          // If adding the content will overshoot the limit
          // use the truncation fu
          if (nextLen >= len) {
            // Chop the string to the amount needed to complete
            // the max length, minus the amount for the tail string if any
            // NOTE: Content segment can be less than the length of the
            // tail string -- this can result in a fudge factor of the length
            // of the tail for the entire string
            trunc = item.substr(0, (len - currLen) - t.length);
            s += trunc;
            // If we're sitting on an open HTML tag
            if (openTag) {
              // If there's content in the final truncated string,
              // just append a closing tag of the same kind as
              // the opening tag
              if (trunc.length) {
                closeTag = openTag.split(
                    /\s|>/)[0].replace('<', '</') + '>';
                s += closeTag;
              }
              // If there's no content in the truncated string,
              // just strip out the previous open tag
              else {
                s = s.replace(openTag, '');
              }
            }
            // Append the tail, if any, and return
            s += t;
            return s;
          }
          else {
            s += item;
          }
          currLen = nextLen;
        }
    }
    return s;
  };


  this.nl2br = function (str) {
	  return str.replace(_NL,'<br />');
  };

  // Converts someVariableName to some_variable_name
  this.snakeize = function (s) {
    return s.replace(/([A-Z]+)/g, '_$1').toLowerCase().
      replace(/^_/, '');
  };

  // Backward-compat
  this.decamelize = this.snakeize;

  // Converts some_variable_name to someVariableName or SomeVariableName
  this.camelize = function (s, initialCap) {
    var ret = s.replace(/_[a-z]{1}/g, function (s)
      { return s.replace('_', '').toUpperCase() });
    if (initialCap) {
      ret = this.capitalize(ret);
    }
    return ret;
  };

  this.capitalize = function (s) {
    return s.substr(0, 1).toUpperCase() + s.substr(1);
  };

  // From Math.uuid.js, http://www.broofa.com/Tools/Math.uuid.js
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function () {
    var chars = _UUID_CHARS, uuid = [], rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

})();

exports.string = string;

