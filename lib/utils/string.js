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
  , object = require('./object').object
  , string;

string = new (function () {

  // Regexes for trimming, and character maps for escaping
  var _LTR = /^\s+/
    , _RTR = /\s+$/
    , _TR = /^\s+|\s+$/g
    , _NL = /\n|\r|\r\n/g
    , _CHARS = {
          '&': '&amp;'
        , '<': '&lt;'
        , '>': '&gt;'
        , '"': '&quot;'
        , '\'': '&#39;'
      }
    , _UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    , _buildEscape
    , _buildEscapeTest;

  // Builds the escape/unescape methods using a
  // map of characters
  _buildEscape = function(direction) {
    return function(string) {
      string = string || '';
      string = string.toString();

      var from, to, p;
      for(p in _CHARS) {
        from = direction == 'to' ? p : _CHARS[p];
        to = direction == 'to' ? _CHARS[p] : p;

        string = string.replace(new RegExp(from, 'gm'), to);
      }

      return string;
    }
  };

  // Builds a method that tests for any escapable
  // characters, useful for avoiding double-scaping if
  // you're not sure if a string has already been escaped
  _buildEscapeTest = function(direction) {
    return function(string) {
      var pat = ''
        , p;

      for(p in _CHARS) {
        pat += direction == 'to' ? p : _CHARS[p];
        pat += '|';
      }

      pat = pat.substr(0, pat.length - 1);
      pat = new RegExp(pat, "gm");
      return pat.test(string)
    }
  };

  // Escape special XMl chars
  this.escapeXML = _buildEscape('to');

  // Unescape XML chars to literal representation
  this.unescapeXML = _buildEscape('from');

  // Test if a string includes special chars
  // that need escaping
  this.needsEscape = _buildEscapeTest('to');

  // Test if a string includes escaped chars
  // that need unescaping
  this.needsUnescape = _buildEscapeTest('from');

  /*
   * toArray(string<String>)
   *
   * ToArray converts a String to an Array
   *
   * Examples:
   *   toArray("geddy")
   *   => ["g", "e", "d", "d", "y"]
  */
  this.toArray = function(string) {
    if(!string) {
      return;
    }

    var arr = []
      , i = -1;

    while(++i < string.length) {
      arr.push(string.substr(i, 1));
    }

    return arr;
  };

  /*
   * reverse(string<String>)
   *
   * Reverse returns a Strings with `string` reversed
   *
   * Examples:
   *   reverse("yddeg")
   *   => "geddy"
  */
  this.reverse = function(string) {
    if(!string) {
      return;
    }
    return this.toArray(string).reverse().join('');
  };

  /*
   * ltrim(string<String>, char<String>)
   *
   * Ltrim trims `char` from the left of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.ltrim = function(string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp('^' + char + '+') : _LTR;
    return string.replace(pat, '');
  };

  /*
   * rtrim(string<String>, char<String>)
   *
   * Rtrim trims `char` from the right of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.rtrim = function (string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp(char + '+$') : _RTR;
    return string.replace(pat, '');
  };

  /*
   * trim(string<String>, char<String>)
   *
   * Trim trims `char` from the right and left of a `string` and returns it
   * if no `char` is given it will trim spaces
  */
  this.trim = function (string, char) {
    if(!string) {
      return;
    }

    var pat = char ? new RegExp('^' + char + '+|' + char + '+$', 'g') : _TR;
    return string.replace(pat, '');
  };

  /*
   * lpad(string<String>, char<String>, width<Number>)
   *
   * Lpad adds `char` to the left of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   lpad("geddy", "&", 7)
   *   => "&&geddy"
  */
  this.lpad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string.toString();

    while(s.length < width) {
      s = char + s;
    }
    return s;
  };

  /*
   * rpad(string<String>, char<String>, width<Number>)
   *
   * Rpad adds `char` to the right of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   rpad("geddy", "&", 7)
   *   => "geddy&&"
  */
  this.rpad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string;

    while(s.length < width) {
      s += char;
    }
    return s;
  };

  /*
   * pad(string<String>, char<String>, width<Number>)
   *
   * Pad adds `char` to the right and left of `string` until the length
   * of `string` is more than `width`
   *
   * Examples:
   *   pad("geddy", "&", 7)
   *   => "&geddy&"
  */
  this.pad = function(string, char, width) {
    if(!string) {
      return;
    }

    // Should width be string.length + 1? or the same to be safe
    width = Number(width) || string.length;
    char = char || ' ';
    var s = string;

    while(s.length < width) {
      s = char + s + char;
    }
    return s;
  };

  /*
   * truncate(string<String>, options<Integer/Object>, callback[Function])
   *
   * Truncates a given `string` after a specified `length` if `string` is longer than
   * `length`. The last characters will be replaced with an `omission` for a total length not
   * exceeding `length`. If `callback` is given it will fire if `string` is truncated.
   *
   * Options:
   *   length    <Integer>          Length the output string will be(default: 30)
   *   len       <Integer>          Alias for length
   *   omission  <String>           Replace last letters with an omission(default: '...')
   *   ellipsis  <String>           Alias for omission
   *   seperator <String>/<RegExp>  Break the truncated text at the nearest `seperator`
   *
   * Warnings:
   *   Please be aware that truncating HTML tags or entities may result in malformed HTML returned
   *
   * Examples:
   *   truncate('Once upon a time in a world', { length: 10 })
   *   => 'Once up...'
   *
   *  truncate('Once upon a time in a world', { length: 20, omission: '...(continued)' })
   *   => 'Once u...(continued)'
   *
   *  truncate('Once upon a time in a world', { length: 15, seperator: /\s/ })
   *   => 'Once upon a...'
   *   Normal Output: => 'Once upon a ...'
   *
   *  truncate('Once upon a time in a world', { length: 15, seperator: ' ' })
   *   => 'Once upon a...'
   *   Normal Output: => 'Once upon a ...'
   *
   *  truncate('<p>Once upon a time</p>', { length: 20 })
   *   => '<p>Once upon a ti...'
  */
  this.truncate = function(string, options, callback) {
    if(!string) {
      return;
    }
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

  /*
   * truncateHTML(string<String>, options<Object>, callback[Function])
   *
   * Truncates a given `string` inside HTML tags after a specified `length` if string` is longer than
   * `length`. The last characters will be replaced with an `omission` for a total length not
   * exceeding `length`. If `callback` is given it will fire if `string` is truncated. If `once` is
   * true only the first string in the first HTML tags will be truncated leaving the others as they
   * were
   *
   * Options:
   *   once <Boolean> If true it will only truncate the first text found in the first
   *                  set of HTML tags(default: false)
   *
   * Notes:
   *   * All options available in the `truncate` helper are also available in `truncateHTML`
   *   * HTML tags will not be truncated, so return value will always be safe  for rendering
   *
   * Examples:
   *   truncateHTML('<p>Once upon a time in a world</p>', { length: 10 })
   *   => '<p>Once up...</p>'
   *
   *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10 })
   *   => '<p>Once up...<small>in a wo...</small></p>'
   *
   *   truncateHTML('<p>Once upon a time <small>in a world</small></p>', { length: 10, once: true })
   *   => '<p>Once up...<small>in a world</small></p>'
  */
  this.truncateHTML = function(string, options, callback) {
    if(!string) {
      return;
    }
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

  /*
   * nl2br(string<String>)
   *
   * Nl2br returns a string where all newline chars are turned
   * into line break HTML tags
   *
   * Examples:
   *   nl2br("geddy\n")
   *   => "geddy<br />"
  */
  this.nl2br = function(string) {
    if(!string) {
      return;
    }

    return string.replace(_NL,'<br />');
  };

  /*
   * snakeize(string<String>)
   *
   * Snakeize converts camelCase and CamelCase strings to snake_case strings
   *
   * Examples:
   *   snakeize("geddyJs")
   *   => "geddy_js"
  */
  this.snakeize = function(string) {
    if(!string) {
      return;
    }

    return string.replace(/([A-Z]+)/g, '_$1').toLowerCase()
      .replace(/^_/, '');
  };
  this.decamelize = this.snakeize; // Compat

  /*
   * camelize(string<String>, options<Object>)
   *
   * Camelize takes a string and optional options and
   * returns a camelCase version of the given `string`
   *
   * Options:
   *   initialCap <Boolean> If initialCap is true the returned
   *                        string will have a capitalized first letter
   *   leadingUnderscore <Boolean> If leadingUnderscore os true then if
   *                               an underscore exists at the beggining
   *                               of the string, it will stay there.
   *                               Otherwise it'll be removed.
   *
   * Examples:
   *   camelize("geddy_js")
   *   => "geddyJs"
   *
   *   camelize("geddy_js", {initialCap: true})
   *   => "GeddyJs"
   *
   *   camelize("geddy_js", {leadingUnderscore: true})
   *   => "_geddyJs"
  */
  this.camelize = function(string, options) {
    if(!string) {
      return;
    }
    var config = {
            initialCap: false
          , leadingUnderscore: false
        }
      , ret;
    options = options || {};

    // Compat
    if(typeof options === 'boolean') {
      config = {
        initialCap: true
      };
    } else {
      object.reverseMerge(options, config);
      //geddy.mixin(config, options);
    }

    ret = string.replace(/_[a-z]{1}/g, function (s) {
      return s.replace('_', '').toUpperCase();
    });

    if (config.leadingUnderscore & string.indexOf('_') === 0) {
      ret = '_' + this.decapitalize(ret);
    }

    // If initialCap is true capitalize it
    ret = config.initialCap ? this.capitalize(ret) : this.decapitalize(ret);

    return ret;
  };

  /*
   * decapitalize(string<String>)
   *
   * Decapitalize returns the given string with the first letter
   * uncapitalized.
   *
   * Examples:
   *   decapitalize("String")
   *   => "string"
  */
  this.decapitalize = function (string) {
    if(!string) {
      return;
    }

    return string.substr(0, 1).toLowerCase() + string.substr(1);
  };

  /*
   * capitalize(string<String>)
   *
   * Capitalize returns the given string with the first letter
   * capitalized.
   *
   * Examples:
   *   decapitalize("string")
   *   => "String"
  */
  this.capitalize = function (string) {
    if(!string) {
      return;
    }

    return string.substr(0, 1).toUpperCase() + string.substr(1);
  };

  /*
   * dasherize(string<String>, replace<String>)
   *
   * Dasherize returns the given `string` converting camelCase and snakeCase
   * to dashes or replace them with the `replace` character.
  */
  this.dasherize = function(string, replace) {
    if(!string) {
      return;
    }
    if(!replace) {
      replace = '-';
    }

    // Todo: Make this simpler, but it needs to change work for the following types:
    // `example_text` => `example-text`
    // `example_Text` => `example-text`
    // `exampleText` => `example-text`
    return string.replace(/.(_([a-z]|[A-Z])|[A-Z]){1}/g, function(string) {
      return string.replace(/(_([a-z]|[A-Z])|[A-Z])/, string.replace(/[a-z]_?/, replace).toLowerCase());
    });
  };

  /*
   * underscorize(string<String>)
   *
   * Underscorize returns the given `string` converting camelCase and snakeCase
   * to underscores.
  */
  this.underscorize = function(string) {
    if(!string) {
      return;
    }

    return this.dasherize(string, '_');
  };

  /*
   * inflection(name<String>, initialCap<String>)
   *
   * Inflection returns an object that contains different inflections
   * created from the given `name`
  */
  this.inflection = function(name, initialCap) {
    if(!name) {
      return;
    }
    if(typeof initialCap === 'undefined') {
      initialCap = true;
    }

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

  // From Math.uuid.js, https://github.com/broofa/node-uuid
  // Robert Kieffer (robert@broofa.com), MIT license
  this.uuid = function(length, radix) {
    var chars = _UUID_CHARS
      , uuid = []
      , r
      , i;

    radix = radix || chars.length;

    if(length) {
      // Compact form
      i = -1;
      while(++i < length) {
        uuid[i] = chars[0 | Math.random()*radix];
      }
    } else {
      // rfc4122, version 4 form

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      i = -1;
      while(++i < 36) {
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

