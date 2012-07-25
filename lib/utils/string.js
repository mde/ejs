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

var inflection = require('../../deps/inflection')
  , string = new (function () {
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
      s = str || '';
      s = s.toString();
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

  this.truncate = function(string, options, callback) {
    if(!string) return;
    var returnString;

    // If `options` is a number assume it's the length and create a options object with length
    if(typeof options === 'number') {
      var num = options;

      options = {};
      options.length = num;
    } else options = options || {};

    // Set `options` defaults
    options.length = options.length || 30;
    options.omission = options.omission || options.ellipsis || '...';

    var stringLen = string.length
      , stringLenWithOmission = options.length - options.omission.length
      , last;

    // Set the index to stop at for `string`
    if(options.seperator) {
      if(options.seperator instanceof RegExp) {
        // If `seperator` is a regex
        if(options.seperator.global) {
          options.seperator = options.seperator;
        } else {
          var ignoreCase = options.seperator.ignoreCase ? 'i' : ''
            , multiLine = options.seperator.multiLine ? 'm' : '';

          options.seperator = new RegExp(options.seperator.source, 'g' + ignoreCase + multiLine);
        }
        var stringToWorkWith = string.substring(0, stringLenWithOmission + 1)
          , lastIndexOf = -1
          , nextStop = 0
          , result;

        while((result = options.seperator.exec(stringToWorkWith)) !== null) {
          lastIndexOf = result.index;
          options.seperator.lastIndex = ++nextStop;
        }
        last = lastIndexOf;
      } else {
        // Seperator is a String
        last = string.lastIndexOf(options.seperator, stringLenWithOmission);
      }

      // If the above couldn't be found, they'll default to -1 so, we need to just set
      // - it as `stringLenWithOmission`
      if(last === -1) last = stringLenWithOmission;
    } else last = stringLenWithOmission;

    if(stringLen < options.length) {
      return string;
    } else {
      returnString = string.substring(0, last) + options.omission;
      returnString += callback ? callback() : '';
      return returnString;
    }
  };

  this.truncateHTML = function(string, options, callback) {
    if(!string) return;
    var returnString = '';

    // If `options` is a number assume it's the length and create a options object with length
    if(typeof options === 'number') {
      var num = options;

      options = {};
      options.length = num;
    } else options = options || {};

    // Set `default` options for HTML specifics
    options.once = options.once || false;

    var pat = /(<[^>]*>)/ // Patter for matching HTML tags
      , arr = [] // Holds the HTML tags and content seperately
      , truncated = false
      , result = pat.exec(string)
      , item
      , firstPos
      , lastPos
      , i;

    // Gather the HTML tags and content into the array
    while(result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if(firstPos !== 0) {
        // Should be content not HTML tags
        arr.push(string.substring(0, firstPos));
        // Slice content from string
        string = string.slice(firstPos);
      }

      arr.push(result[0]); // Push HTML tags
      string = string.slice(result[0].length);

      // Re-run the pattern on the new string
      result = pat.exec(string);
    }
    if(string !== '') arr.push(string);

    // Loop through array items appending the tags to the string,
    // - and truncating the text then appending it to content
    i = -1;
    while(++i < arr.length) {
      item = arr[i];
      switch(true) {
        // Closing tag
        case item.indexOf('</') == 0:
          returnString += item;
          openTag = null;
          break;
        // Opening tag
        case item.indexOf('<') == 0:
          returnString += item;
          openTag = item;
          break;
        // Normal text
        default:
          if(options.once && truncated) {
            returnString += item;
          } else {
            returnString += this.truncate(item, options, callback);
            truncated = true;
          }
          break;
      }
    }

    return returnString;
  };


  this.nl2br = function (str) {
	  return str.replace(_NL,'<br />');
  };

  // Converts someVariableName to some_variable_name
  this.snakeize = function (s) {
    return s.replace(/([A-Z]+)/g, '_$1').toLowerCase()
      .replace(/^_/, '');
  };

  // Backward-compat
  this.decamelize = this.snakeize;

  // Converts some_variable_name to someVariableName or SomeVariableName
  this.camelize = function (str, options) {
    var ret
      , config = {
          initialCap: false
        , leadingUnderscore: false
        }
      , opts = options || {};

    if (!str) {
      return;
    }

    // Backward-compat
    if (typeof opts == 'boolean') {
      config = {
        initialCap: true
      };
    }
    else {
      geddy.mixin(config, opts);
    }

    ret = str.replace(/_[a-z]{1}/g, function (s) {
      return s.replace('_', '').toUpperCase();
    });

    if (config.leadingUnderscore & str.indexOf('_') === 0) {
      ret = '_' + this.decapitalize(ret);
    }

    // If initialCap is true capitalize it
    ret = config.initialCap ? this.capitalize(ret) : this.decapitalize(ret);

    return ret;
  };

  this.capitalize = function (s) {
    return s.substr(0, 1).toUpperCase() + s.substr(1);
  };

  this.decapitalize = function (s) {
    return s.substr(0, 1).toLowerCase() + s.substr(1);
  };

  this.dasherize = function(s, replace) {
    if(!replace) replace = '-';

    // Todo: Make this simpler, but it needs to change work for the following types:
    // `example_text` => `example-text`
    // `example_Text` => `example-text`
    // `exampleText` => `example-text`
    return s.replace(/.(_([a-z]|[A-Z])|[A-Z]){1}/g, function(s) {
      return s.replace(/(_([a-z]|[A-Z])|[A-Z])/, s.replace(/[a-z]_?/, replace).toLowerCase());
    });
  };

  this.underscorize = function(s) {
    return this.dasherize(s, '_');
  };

  this.inflection = function(name, initialCap) {
    if(typeof initialCap === 'undefined') initialCap = true;
    var self = this
      , nameSingular = inflection.singularize(this.snakeize(name))
      , namePlural = inflection.pluralize(nameSingular);

    return {
      filename: {
          singular: nameSingular
        , plural: namePlural
      },
      constructor: {
          singular: self.camelize(nameSingular, initialCap)
        , plural: self.camelize(namePlural, initialCap)
      },
      property: {
          singular: self.camelize(nameSingular)
        , plural: self.camelize(namePlural)
      },
      url: {
          singular: self.underscorize(nameSingular)
        , plural: self.underscorize(namePlural)
      }
    };
  };

  // From Math.uuid.js, http://www.broofa.com/Tools/Math.uuid.js
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function (len, rad) {
    var chars = _UUID_CHARS
      , uuid = []
      , radix = rad || chars.length
      , r;

    if (len) {
      // Compact form
      for (var i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    }
    else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

})();

exports.string = string;

