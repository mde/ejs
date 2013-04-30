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

var utils = require('utilities')
  , ejs;

ejs = new (function () {
  this.compile = function (template) {
    var templ = new Template(template);
    return templ.compile();
  };

  this.render = function (template, data) {
    return (this.compile(template))(data);
  };

})();

var Template = function (text) {
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
};

Template.prototype = new function () {
  var _REGEX = /(<%%)|(%%>)|(<%=)|(<%-)|(<%#)|(<%)|(%>)|(-%>)/
    , _GLOBAL = (function () { return this; })();

  this.modes = {
      EVAL: 'eval'
    , ESCAPED: 'escaped'
    , RAW: 'raw'
    , APPEND: 'append'
    , COMMENT: 'comment'
    , LITERAL: 'literal'
  };

  this.handleErr = function (e, line) {
    var src = this.templateText.split('\n')
      , ctxt = ''
      , err = new Error()
      , start = Math.max(line - 3, 0)
      , end = Math.min(src.length, line + 3)
      , arr = src.slice(start, end)
      , curr;

    for (var i = 0, len = arr.length; i < len; i++) {
      curr = i + start + 1;
      ctxt += (curr == line ? ' >> ' : '    ')
        + curr
        + '| '
        + arr[i] + '\n';
    }

    err.name = e.name;
    err.message = 'ejs:' + line + '\n' + ctxt + e.message;
    throw err;
  };

  this.compile = function () {
    var self = this
      , src;

    if (!this.source) {
      this.generateSource();
    }

    src = 'var __output = "", __line = 1; with (locals) { try {' +
        this.source + '} catch (e) { rethrow(e, __line); } } return __output;';

    fn = new Function('locals', src);

    rethrow = function (e, line) { self.handleErr(e, line); };

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    return function (data, context) {
      // Prevent mixin pollution
      var d = utils.mixin({}, data);
      var locals = utils.mixin(d, {
        utils: utils
      , rethrow: rethrow
      });
      return fn.call(context || _GLOBAL, locals);
    };

  };

  this.process = function (params) {
    var self = this
      , params = params || {}
      , domNode = params.node
      , src
      , fn
      , rethrow;

    this.data = params;
    this.source = this.source || ''; // Cache the template source for speed

    if(!this.source) this.generateSource();

    src = 'var __output = "", __line = 1; with (locals) { try {' +
        this.source + '} catch (e) { rethrow(e, __line); } } return __output;';
    fn = new Function('locals', src);
    rethrow = function (e, line) { self.handleErr(e, line); };

    this.markup = fn.call(this, utils.mixin({
        utils: utils
      , rethrow: rethrow
    }, this.data));

    if (domNode) {
      domNode.innerHTML = this.markup;
    }
    return this.markup;
  };

  this.generateSource = function () {
    var matches = this.parseTemplateText()
      , line
      , i;

    if (matches) {
      i = -1
      while (++i < matches.length) {
        line = matches[i];

        if (line) {
          this.scanLine(line);
        }
      }
    }
  };

  this.parseTemplateText = function () {
    var str = this.templateText
      , pat = _REGEX
      , result = pat.exec(str)
      , arr = []
      , firstPos
      , lastPos;

    while (result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

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
      , _addOutput;

    _addOutput = function () {
      if (self.truncate) {
        line = line.replace('\n', '');
      }

      // Preserve literal slashes
      line = line.replace(/\\/g, '\\\\');

      // Convert linebreaks
      line = line.replace(/\n/g, '\\n');
      line = line.replace(/\r/g, '\\r');

      // Escape double-quotes
      // - this will be the delimiter during execution
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
        else _addOutput();
    }

    if (newLineCount) {
      this.currentLine += newLineCount;
      this.source += '__line = ' + this.currentLine + ';';
    }
  };
};

module.exports = ejs;
