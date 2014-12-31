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

var utils = require('./utils')
  , ejs
  , rethrow
  , _DEFAULT_DELIMITER = '%'
  , _REGEX_STRING = '(<%%)|(%%>)|(<%=)|(<%-)|(<%#)|(<%)|(%>)|(-%>)'
  , _GLOBAL = (function () { return this; })();

rethrow = function (e, lines, filename, line) {
  var src = lines.split('\n')
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
  err.message = (filename || 'ejs') + ':' + line + '\n' + ctxt + e.message;
  throw err;
};



exports.compile = function (template, opts) {
  var templ = new Template(template, opts || {});
  return templ.compile();
};

exports.render = function (template, data, opts) {
  return (exports.compile(template, opts))(data);
};


var Template = function (text, opts) {
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  this.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  this.regex = this.createRegex();
  this.client = opts.client || false;
  this.escapeFunction = opts.escape || utils.escapeXML;
  this.compileDebug = opts.compileDebug !== false;
  this.filename = opts.filename;
};

Template.prototype = new function () {

  this.modes = {
      EVAL: 'eval'
    , ESCAPED: 'escaped'
    , RAW: 'raw'
    , APPEND: 'append'
    , COMMENT: 'comment'
    , LITERAL: 'literal'
  };

  this.createRegex = function () {
    var str = _REGEX_STRING
      , delim = utils.escapeRegExpChars(this.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  };

  this.compile = function () {
    var self = this
      , src
      , fn
      , escape = this.escapeFunction;

    if (!this.source) {
      this.generateSource();
    }

    if (this.compileDebug) {
      src = 'var __line = 1' +
          ', __lines = ' + JSON.stringify(this.templateText) +
          ', __filename = ' + (this.filename ?
                JSON.stringify(this.filename) : 'undefined') +
          '; try {' +
          this.source + '} catch (e) { rethrow(e, __lines, __filename, __line); }';
    }
    else {
      src = this.source;
    }

    if (this.client) {
      src = 'escape = escape || ' + escape.toString() + ';\n' + str;
      src = 'rethrow = rethrow || ' + rethrow.toString() + ';\n' + str;
    }

    try {
      fn = new Function('locals, escape, rethrow', src);
    }
    catch(e) {
      if (e instanceof SyntaxError) {
        if (this.filename) {
          e.message += ' in ' + this.filename;
        }
        e.message += ' while compiling EJS';
        throw e;
      }
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    return function (data, context) {
      // Prevent mixin pollution
      var locals = utils.shallowCopy({}, data);
      return fn.apply(context || _GLOBAL, [locals, escape, rethrow]);
    };

  };

  this.generateSource = function () {
    var matches = this.parseTemplateText()
      , line
      , i;

    this.source += 'var __output = ""; with (locals) { ';

    if (matches) {
      i = -1
      while (++i < matches.length) {
        line = matches[i];

        if (line) {
          this.scanLine(line);
        }
      }
    }

    this.source += '} return __output;';

  };

  this.parseTemplateText = function () {
    var str = this.templateText
      , pat = this.regex
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
      , d = this.delimiter
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
      case '<' + d:
        this.mode = this.modes.EVAL;
        break;
      case '<' + d + '=':
        this.mode = this.modes.ESCAPED;
        break;
      case '<' + d + '-':
        this.mode = this.modes.RAW;
        break;
      case '<' + d + '#':
        this.mode = this.modes.COMMENT;
        break;
      case '<' + d + d:
        this.mode = this.modes.LITERAL;
        this.source += '__output += "' + line.replace('<' + d + d, '<' + d) + '";';
        break;
      case d + '>':
      case '-' + d + '>':
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
              this.source += '__output += escape(' +
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

