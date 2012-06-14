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

var utils = require('../../utils')
  , ejs = {};

ejs.Template = function (p) {
  var UNDEF;
  var params = p || {};

  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.templateText = params.text ||
    // If you don't want to use Fleegix.js,
    // override getTemplateTextFromNode to use
    // textarea node value for template text
    this.getTemplateTextFromNode(params.node);
  this.afterLoaded = params.afterLoaded;
  this.source = '';
  this.markup = UNDEF;
  // Try to get from URL
  if (typeof this.templateText == 'undefined') {
    // If you don't want to use Fleegix.js,
    // override getTemplateTextFromUrl to use
    // files for template text
    this.getTemplateTextFromUrl(params);
  }
};

ejs.Template.prototype = new function () {
  var _REGEX = /(<%%)|(%%>)|(<%=)|(<%-)|(<%#)|(<%)|(%>)|(-%>)/;
  this.modes = {
    EVAL: 'eval'
  , ESCAPED: 'escaped'
  , RAW: 'raw'
  , APPEND: 'append'
  , COMMENT: 'comment'
  , LITERAL: 'literal'
  };
  this.getTemplateTextFromNode = function (node) {
    // Requires the fleegix.xhr module
    if (typeof fleegix.string == 'undefined') {
      throw('Requires fleegix.string module.'); }
    var ret;
    if (node) {
      ret = node.value;
      ret = fleegix.string.unescapeXML(ret);
      ret = fleegix.string.trim(ret);
    }
    return ret;
  };
  this.getTemplateTextFromUrl = function (params) {
    // Requires the fleegix.xhr module
    if (typeof fleegix.xhr == 'undefined') {
      throw('Requires fleegix.xhr module.'); }
    var self = this;
    var url = params.url;
    var noCache = params.preventCache || false;
    // Found text in cache, and caching is turned on
    if (text && !noCache) {
      this.templateText = text;
    }
    // Otherwise go grab the text
    else {
      // Callback for setting templateText and caching --
      // used for both sync and async loading
      var callback = function (s) {
        self.templateText = s;
        ejs.templateTextCache[url] = s;
        // Use afterLoaded hook if set
        if (typeof self.afterLoaded == 'function') {
          self.afterLoaded();
        }
      };
      var opts;
      if (params.async) {
        opts = {
          url: url,
          method: 'GET',
          preventCache: noCache,
          async: true,
          handleSuccess: callback
        };
        // Get templ text asynchronously, wait for
        // loading to exec the callback
        fleegix.xhr.send(opts);
      }
      else {
        opts = {
          url: url,
          method: 'GET',
          preventCache: noCache,
          async: false
        };
        // Get the templ text inline and pass directly to
        // the callback
        text = fleegix.xhr.send(opts);
        callback(text);
      }
    }
  };

  this.handleErr = function (e, line) {
    var src = this.templateText.split('\n')
      , arr
      , ctxt = ''
      , err = new Error()
      , start = Math.max(line - 3, 0)
      , end = Math.min(src.length, line + 3)
      , curr;

    arr = src.slice(start, end);

    for (i = 0, ii = arr.length; i < ii; i++) {
      curr = i + start + 1;
      ctxt += (curr == line ? ' >> ' : '    ')
        + curr
        + '| '
        + arr[i] + '\n';
    }

    err.name = e.name;
    err.message = 'ejs:' + line + '\n' + ctxt +
      e.message;
    throw err;
  };

  this.process = function (p) {
    var self = this
      , params = p || {}
      , src
      , fn
      , rethrow;
    this.data = params || {};
    var domNode = params.node;
    // Cache/reuse the generated template source for speed
    this.source = this.source || '';
    if (!this.source) { this.generateSource(); }

    src = 'var __output = "", __line = 1; with (locals) { try {' +
        this.source + '} catch(e) { rethrow(e, __line); } } return __output;';

    fn = new Function ('locals', src);
    rethrow = function (e, line) { self.handleErr(e, line); };
    this.markup = fn.call(this, geddy.mixin({utils: utils,
        rethrow: rethrow}, this.data));

    if (domNode) {
      domNode.innerHTML = this.markup;
    }
    return this.markup;
  };
  this.generateSource = function () {
    var line = '';
    var matches = this.parseTemplateText();
    if (matches) {
      for (var i = 0; i < matches.length; i++) {
        line = matches[i];
        if (line) {
          this.scanLine(line);
        }
      }
    }
  };
  this.parseTemplateText = function() {
    var str = this.templateText;
    var pat = _REGEX;
    var result = pat.exec(str);
    var arr = [];
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
    return arr;
  };
  this.scanLine = function (line) {
    var self = this
      , newLineCount = 0
      , _addOutput = function () {
          if (self.truncate) {
            line = line.replace('\n', '');
          }
          // Preserve literal slashes
          line = line.replace(/\\/g, '\\\\');
          // Convert linebreaks
          line = line.replace(/\n/g, '\\n');
          line = line.replace(/\r/g, '\\r');
          // Escape double-quotes -- this will be the delimiter
          // during execution
          line = line.replace(/"/g, '\\"');
          self.source += '__output += "' + line + '";';
        };

    newLineCount = (line.split('\n').length - 1);

    switch (line) {
      case '<%':
        this.mode = this.modes.EVAL;
        break;
      case '<%=':
        this.mode = this.modes.ESCAPED;
        break;
      case '<%-':
        this.mode = this.modes.RAW;
        break;
      case '<%#':
        this.mode = this.modes.COMMENT;
        break;
      case '<%%':
        this.mode = this.modes.LITERAL;
        this.source += '__output += "' + line.replace('<%%', '<%') + '";';
        break;
      case '%>':
      case '-%>':
        if (this.mode == this.modes.LITERAL) {
          _addOutput();
        }
        this.mode = null;
        this.truncate = line.indexOf('-') == 0;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          switch (this.mode) {
            // Just executing code
            case this.modes.EVAL:
              this.source += line;
              break;
            // Exec, esc, and output
            case this.modes.ESCAPED:
              // Add the exec'd, escaped result to the output
              this.source += '__output += utils.string.escapeXML(' +
                  line.replace(/;\S*/, '') + ');';
              break;
            // Exec and output
            case this.modes.RAW:
              // Add the exec'd result to the output
              this.source += '__output += ' + line + ';';
              break;
            case this.modes.COMMENT:
              // Do nothing
              break;
            // Literal <%% mode, append as raw output
            case this.modes.LITERAL:
              _addOutput();
              break;
          }
        }
        // In string mode, just add the output
        else {
          _addOutput();
        }

    if (newLineCount) {
      this.currentLine += newLineCount;
      this.source += '__line = ' + this.currentLine + ';';
    }



    }
  };
};

exports.Template = ejs.Template;
