/*
 * EJS Embedded JavaScript templates
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

'use strict';

var fs = require('fs')
  , utils = require('./utils')
  , jsCache = {}
  , _VERSION_STRING = require('../package.json').version
  , _DEFAULT_DELIMITER = '%'
  , _DEFAULT_LOCALS_NAME = 'locals'
  , _REGEX_STRING = '(<%%|<%=|<%-|<%#|<%|%>|-%>)'
  , _OPTS = [ 'cache', 'filename', 'delimiter', 'scope', 'context'
            , 'debug', 'compileDebug', 'client', '_with'
            ]
  , _TRAILING_SEMCOL = /;\s*$/;

exports.localsName = _DEFAULT_LOCALS_NAME;

exports.resolveInclude = function(name, filename) {
  var path = require('path')
    , dirname = path.dirname
    , extname = path.extname
    , resolve = path.resolve
    , includePath = resolve(dirname(filename), name)
    , ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
}


// Returns a possibly cached template function, set by options.cache.
// `template` is the string of EJS to compile.
// If template is undefined then the file specified in options.filename is
// read.
function handleCache(options, template) {
  var fn
    , path = options.filename
    , hasTemplate = template !== undefined;

  if (options.cache) {
    if (!path) {
      throw new Error('cache option requires a filename');
    }
    fn = jsCache[path];
    if (fn) {
      return fn;
    }
    if (!hasTemplate) {
      template = fs.readFileSync(path, {encoding: 'utf8'});
    }
  }
  else if (!hasTemplate) {
    if (!path) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fs.readFileSync(path, {encoding: 'utf8'});
  }
  fn = exports.compile(template.trim(), options);
  if (options.cache) {
    jsCache[path] = fn;
  }
  return fn;
}

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options || /* istanbul ignore next */ {});
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  opts.filename = exports.resolveInclude(path, opts.filename);
  return handleCache(opts);
}

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options || {})
    , includePath
    , template;
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  includePath = exports.resolveInclude(path, opts.filename);
  template = fs.readFileSync(includePath).toString().trim();

  opts.filename = includePath;
  var templ = new Template(template, opts);
  templ.generateSource();
  return templ.source;
}

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
}

function cpOptsInData(data, opts) {
  _OPTS.forEach(function (p) {
    if (typeof data[p] != 'undefined') {
      opts[p] = data[p];
    }
  });
  delete data.__expressRender__;
}

function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
}
exports.compile = compile;

// template, [data], [opts]
// Have to include an empty data object if you want opts and no data
exports.render = function (template, data, opts) {
  data = data || {};
  opts = opts || {};
  var fn;

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    cpOptsInData(data, opts);
  }

  fn = handleCache(opts, template);
  return fn.call(opts.context, data);
};

// path, [data], [opts], cb
// Have to include an empty data object if you want opts and no data
exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments)
    , path = args.shift()
    , cb = args.pop()
    , data = args.shift() || {}
    , opts = args.pop() || {}
    , result
    , failed = false;

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 3) {
    cpOptsInData(data, opts);
  }
  opts.filename = path;

  try {
    result = handleCache(opts)(data);
  }
  catch(err) {
    return process.nextTick(function () {
      cb(err);
    });
  }
  process.nextTick(function () {
    cb(null, result);
  });
};

exports.clearCache = function () {
  jsCache = {};
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options._with = typeof opts._with != 'undefined' ? opts._with : true;
  options.cache = opts.cache || false;
  this.opts = options;

  this.regex = this.createRegex();
}

Template.modes = {
    EVAL: 'eval'
  , ESCAPED: 'escaped'
  , RAW: 'raw'
  , COMMENT: 'comment'
  , LITERAL: 'literal'
};

Template.prototype = new function () {
  this.createRegex = function () {
    var str = _REGEX_STRING
      , delim = utils.escapeRegExpChars(this.opts.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  };

  this.compile = function () {
    var src
      , fn
      , opts = this.opts
      , escape = opts.escapeFunction;

    if (!this.source) {
      this.generateSource();
      var prepended = 'var __output = [];';
      if (opts._with !== false) {
        prepended +=  ' with (' + exports.localsName + ' || {}) { ';
      }
      this.source  = prepended + this.source;
      if (opts._with !== false) {
        this.source += '}';
      }
      this.source += ';return __output.join("").trim();';
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' +
          ', __lines = ' + JSON.stringify(this.templateText) +
          ', __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') +
          '; try {' +
          this.source + '} catch (e) { rethrow(e, __lines, __filename, __line); }';
    }
    else {
      src = this.source;
    }

    if (opts.debug) {
      console.log(src);
    }

    if (opts.client) {
      if (escape !== utils.escapeXML) {
        src = 'escape = escape || ' + escape.toString() + ';\n' + src;
      }
      else {
        src = utils.escapeFuncStr
            + 'escape = escape || '
            + escape.toString() + ';\n'
            + src;
      }
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';\n' + src;
      }
    }

    try {
      fn = new Function(exports.localsName + ', escape, include, rethrow', src);
    }
    catch(e) {
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs';
        throw e;
      }
    }

    if (opts.client) {
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    return function (data) {
      var include = function (path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn(data || {}, escape, include, rethrow);
    };

  };

  this.generateSource = function () {
    var self = this
      , matches = this.parseTemplateText()
      , d = this.opts.delimiter;

    if (matches && matches.length) {
      matches.forEach(function (line, index) {
        var closing
          , include
          , includeOpts
          , includeSrc;
        // If this is an opening tag, check for closing tags
        // FIXME: May end up with some false positives here
        // Better to store modes as k/v with '<' + delimiter as key
        // Then this can simply check against the map
        if ( line.indexOf('<' + d) === 0        // If it is a tag
          && line.indexOf('<' + d + d) !== 0) { // and is not escaped
          closing = matches[index + 2];
          if (!(closing == d + '>' || closing == '-' + d + '>')) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        // HACK: backward-compat `include` preprocessor directives
        if ((include = line.match(/^\s*include\s+(\S+)/))) {
          includeOpts = utils.shallowCopy({}, self.opts);
          includeSrc = includeSource(include[1], includeOpts);
          includeSrc = ';(function(){' + includeSrc + '})();';
          self.source += includeSrc;
        }
        else {
          self.scanLine(line);
        }
      });
    }

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

    if (str) {
      arr.push(str);
    }

    return arr;
  };

  this.scanLine = function (line) {
    var self = this
      , d = this.opts.delimiter
      , newLineCount = 0;

    function _addOutput() {
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
      self.source += ';__output.push("' + line + '");';
    }

    newLineCount = (line.split('\n').length - 1);

    switch (line) {
      case '<' + d:
        this.mode = Template.modes.EVAL;
        break;
      case '<' + d + '=':
        this.mode = Template.modes.ESCAPED;
        break;
      case '<' + d + '-':
        this.mode = Template.modes.RAW;
        break;
      case '<' + d + '#':
        this.mode = Template.modes.COMMENT;
        break;
      case '<' + d + d:
        this.mode = Template.modes.LITERAL;
        this.source += ';__output.push("' + line.replace('<' + d + d, '<' + d) + '");';
        break;
      case d + '>':
      case '-' + d + '>':
        if (this.mode == Template.modes.LITERAL) {
          _addOutput();
        }

        this.mode = null;
        this.truncate = line.indexOf('-') === 0;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          // If '//' is found without a line break, add a line break.
          switch (this.mode) {
            case Template.modes.EVAL:
            case Template.modes.ESCAPED:
            case Template.modes.RAW:
              if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                line += '\n';
              }
          }
          switch (this.mode) {
            // Just executing code
            case Template.modes.EVAL:
              this.source += ';' + line;
              break;
            // Exec, esc, and output
            case Template.modes.ESCAPED:
              // Add the exec'd, escaped result to the output
              // Have to prevent the string-coercion of `undefined` and `null`
              // in the `escape` function -- making a `join` call like below unnecessary
              this.source += ';__output.push(escape(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + '))';
              break;
            // Exec and output
            case Template.modes.RAW:
              // Add the exec'd result to the output
              // Using `join` here prevents string-coercion of `undefined` and `null`
              // without filtering out falsey values like zero
              this.source += ';__output.push(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + ')';
              break;
            case Template.modes.COMMENT:
              // Do nothing
              break;
            // Literal <%% mode, append as raw output
            case Template.modes.LITERAL:
              _addOutput();
              break;
          }
        }
        // In string mode, just add the output
        else {
          _addOutput();
        }
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += ';__line = ' + this.currentLine + ';';
    }
  };
};

// Express support
exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if (require.extensions) {
  require.extensions['.ejs'] = function (module, filename) {
    filename = filename || /* istanbul ignore next */ module.filename;
    var options = {
          filename: filename
        , client: true
        }
      , template = fs.readFileSync(filename).toString().trim()
      , fn = compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

exports.VERSION = _VERSION_STRING;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}
