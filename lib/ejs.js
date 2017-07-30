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

/**
 * @file Embedded JavaScript templating engine. {@link http://ejs.co}
 * @author Matthew Eernisse <mde@fleegix.org>
 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
 * @project EJS
 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
 */

/**
 * EJS internal functions.
 *
 * Technically this "module" lies in the same file as {@link module:ejs}, for
 * the sake of organization all the private functions re grouped into this
 * module.
 *
 * @module ejs-internal
 * @private
 */

/**
 * Embedded JavaScript templating engine.
 *
 * @module ejs
 * @public
 */

var fs = require('fs');
var path = require('path');
var utils = require('./utils');

var scopeOptionWarned = false;
var _VERSION_STRING = require('../package.json').version;
var _DEFAULT_DELIMITER = '%';
var _DEFAULT_LOCALS_NAME = 'locals';
var _NAME = 'ejs';

var _REGEX_ALL_BUT_TAGS = '(?:(?![-_%]?%>|<%)[^]|(<%%|%%>))';
/**
 * Find next open tag, skip literals
 * $1: any data before open tag
 * $2: indicates presence of literal(s) (from _REGEX_ALL_BUT_TAGS)
 * $3: open tag modifier (_=-#)
 * $4: invalid/unmatched closing tag
 * Find next close tag, skip literals
 * $5: any data before close tag
 * $6: indicates presence of literal(s) (from _REGEX_ALL_BUT_TAGS)
 * $7: close tag modifier (_-)
 */
var _REGEX_STRING_NEXT_TAG  = '^('+_REGEX_ALL_BUT_TAGS+'*)(?:<%(?!%)([__OPENTAG__])?|([_-]?%>))'  + '('+_REGEX_ALL_BUT_TAGS+'*)(?:([-_]?)%>)?';

// Replace literals
var _REGEX_STRING_LITERAL = '(<%)%|%(%>)';
var _REGEX_STRING_LITERAL_REPL = '$1$2';


var _OPTS = ['delimiter', 'scope', 'context', 'debug', 'compileDebug',
  'client', '_with', 'rmWhitespace', 'strict', 'filename'];
// We don't allow 'cache' option to be passed in the data obj
// for the normal `render` call, but this is where Express puts it
// so we make an exception for `renderFile`
var _OPTS_EXPRESS = _OPTS.concat('cache');
var _BOM = /^\uFEFF/;

/**
 * EJS template function cache. This can be a LRU object from lru-cache NPM
 * module. By default, it is {@link module:utils.cache}, a simple in-process
 * cache that grows continuously.
 *
 * @type {Cache}
 */

exports.cache = utils.cache;
exports.cacheFileExist = new utils.Cache();

/**
 * Custom file loader. Useful for template preprocessing or restricting access
 * to a certain part of the filesystem.
 *
 * @type {fileLoader}
 */

exports.fileLoader = fs.readFileSync;
exports.fileExists = fs.existsSync;

/**
 * Name of the object containing the locals.
 *
 * This variable is overridden by {@link Options}`.localsName` if it is not
 * `undefined`.
 *
 * @type {String}
 * @public
 */

exports.localsName = _DEFAULT_LOCALS_NAME;

/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * @param {String}  name     specified path
 * @param {String}  filename parent file path
 * @param {Boolean} isDir    parent file path whether is directory
 * @return {String}
 */
exports.resolveInclude = function(name, filename, isDir) {
  var dirname = path.dirname;
  var extname = path.extname;
  var resolve = path.resolve;
  var includePath = resolve(isDir ? filename : dirname(filename), name);
  var ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
};

function checkFileExists(filePath, options) {
  if (! options.cache) {
    return exports.fileExists(filePath);
  }
  var r = exports.cacheFileExist.get(filePath);
  if (r !== undefined) {
    return r;
  }
  r = exports.fileExists(filePath);
  exports.cacheFileExist.set(filePath, r);
  return r;
}

/**
 * Get the path to the included file by Options
 *
 * @param  {String}  path    specified path
 * @param  {Options} options compilation options
 * @return {String}
 */
function getIncludePath(path, options) {
  var includePath;
  var filePath;
  var views = options.views;

  // Abs path
  if (path.charAt(0) == '/') {
    includePath = exports.resolveInclude(path.replace(/^\/*/,''), options.root || '/', true);
  }
  // Relative paths
  else {
    // Look relative to a passed filename first
    if (options.filename) {
      filePath = exports.resolveInclude(path, options.filename);
      if (checkFileExists(filePath, options)) {
        includePath = filePath;
      }
    }
    // Then look in any views directories
    if (!includePath) {
      if (Array.isArray(views) && views.some(function (v) {
        filePath = exports.resolveInclude(path, v, true);
        return checkFileExists(filePath, options);
      })) {
        includePath = filePath;
      }
    }
    if (!includePath) {
      throw new Error('Could not find include include file.');
    }
  }
  return includePath;
}
exports.getIncludePath = getIncludePath;

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `template` is not set, the file specified in `options.filename` will be
 * read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @memberof module:ejs-internal
 * @param {Options} options   compilation options
 * @param {String} [template] template source
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned.
 * @static
 */

function handleCache(options, template) {
  var func;
  var filename = options.filename;
  var hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!filename) {
      throw new Error('cache option requires a filename');
    }
    func = exports.cache.get(filename);
    if (func) {
      return func;
    }
    if (!hasTemplate) {
      template = fileLoader(filename).toString().replace(_BOM, '');
    }
  }
  else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!filename) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fileLoader(filename).toString().replace(_BOM, '');
  }
  func = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(filename, func);
  }
  return func;
}
exports.handleCache = handleCache;

/**
 * Try calling handleCache with the given options and data and call the
 * callback with the result. If an error occurs, call the callback with
 * the error. Used by renderFile().
 *
 * @memberof module:ejs-internal
 * @param {Options} options    compilation options
 * @param {Object} data        template data
 * @param {RenderFileCallback} cb callback
 * @static
 */

function tryHandleCache(options, data, cb) {
  var result;
  try {
    result = handleCache(options)(data);
  }
  catch (err) {
    return cb(err);
  }
  return cb(null, result);
}

/**
 * fileLoader is independent
 *
 * @param {String} filePath ejs file path.
 * @return {String} The contents of the specified file.
 * @static
 */

function fileLoader(filePath){
  return exports.fileLoader(filePath);
}

/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned
 * @static
 */

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options);
  opts.filename = getIncludePath(path, opts);
  return handleCache(opts);
}
exports.includeFile = includeFile;

/**
 * Get the JavaScript source of an included file.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {Object}
 * @static
 */

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options);
  var includePath;
  var template;
  includePath = getIncludePath(path, opts);
  template = fileLoader(includePath).toString().replace(_BOM, '');
  opts.filename = includePath;
  var templ = new exports.Template(template, opts);
  templ.generateSource();
  return {
    source: templ.source,
    filename: includePath,
    template: template
  };
}

/**
 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
 * `lineno`.
 *
 * @implements RethrowCallback
 * @memberof module:ejs-internal
 * @param {Error}  err      Error object
 * @param {String} str      EJS source
 * @param {String} filename file name of the EJS file
 * @param {String} lineno   line number of the error
 * @static
 */

function rethrow(err, str, flnm, lineno, esc){
  var lines = str.split('\n');
  var start = Math.max(lineno - 3, 0);
  var end = Math.min(lines.length, lineno + 3);
  var filename = esc(flnm); // eslint-disable-line
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

function stripSemi(str){
  return str.replace(/;(\s*$)/, '$1');
}

/**
 * Compile the given `str` of ejs into a template function.
 *
 * @param {String}  template EJS template
 *
 * @param {Options} opts     compilation options
 *
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `opts.client`, either type might be returned.
 * @public
 */

exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned){
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new exports.Template(template, opts);
  return templ.compile();
};

/**
 * Render the given `template` of ejs.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}   template EJS template
 * @param {Object}  [data={}] template data
 * @param {Options} [opts={}] compilation and rendering options
 * @return {String}
 * @public
 */

exports.render = function (template, d, o) {
  var data = d || {};
  var opts = o || {};

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    utils.shallowCopyFromList(opts, data, _OPTS);
  }

  return handleCache(opts, template)(data);
};

/**
 * Render an EJS file at the given `path` and callback `cb(err, str)`.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}             path     path to the EJS file
 * @param {Object}            [data={}] template data
 * @param {Options}           [opts={}] compilation and rendering options
 * @param {RenderFileCallback} cb callback
 * @public
 */

exports.renderFile = function () {
  var filename = arguments[0];
  var cb = arguments[arguments.length - 1];
  var opts = {filename: filename};
  var data;

  if (arguments.length > 2) {
    data = arguments[1];

    // No options object -- if there are optiony names
    // in the data, copy them to options
    if (arguments.length === 3) {
      // Express 4
      if (data.settings) {
        if (data.settings['view options']) {
          utils.shallowCopyFromList(opts, data.settings['view options'], _OPTS_EXPRESS);
        }
        if (data.settings.views) {
          opts.views = data.settings.views;
        }
      }
      // Express 3 and lower
      else {
        utils.shallowCopyFromList(opts, data, _OPTS_EXPRESS);
      }
    }
    else {
      // Use shallowCopy so we don't pollute passed in opts obj with new vals
      utils.shallowCopy(opts, arguments[2]);
    }

    opts.filename = filename;
  }
  else {
    data = {};
  }

  return tryHandleCache(opts, data, cb);
};

/**
 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
 * @public
 */

exports.clearCache = function () {
  exports.cache.reset();
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.currentLine = 1;
  this.source = '';
  this.dependencies = [];
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options.strict = opts.strict || false;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  options.root = opts.root;
  options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
  options.views = opts.views;

  if (options.strict) {
    options._with = false;
  }
  else {
    options._with = typeof opts._with != 'undefined' ? opts._with : true;
  }

  this.opts = options;
  this.modeMap = this.getModeMap();
  this.createRegex();
}

exports.modes = {
  EVAL: 'eval',
  ESCAPED: 'escaped',
  RAW: 'raw',
  COMMENT: 'comment',
};

Template.prototype = {
  getModeMap: function () {
    return {
      '':  exports.modes.EVAL,
      '=': exports.modes.ESCAPED,
      '-': exports.modes.RAW,
      '_': exports.modes.EVAL,
      '#': exports.modes.COMMENT,
    };
  },

  createRegex: function () {
    var delim = utils.escapeRegExpChars(this.opts.delimiter);

    this.regexNextTag = new RegExp(_REGEX_STRING_NEXT_TAG
      .replace(/__OPENTAG__/, utils.escapeRegExpChars(Object.keys(this.modeMap).join('').replace(/([^-]*)(-?)([^-]*)/, '$1$3$2')))
      .replace(/%/g, delim)
    );
    this.regexLiteral = new RegExp(_REGEX_STRING_LITERAL.replace(/%/g, delim), 'g');
    this.regexLiteralReplace = _REGEX_STRING_LITERAL_REPL;
  },

  compile: function () {
    var self = this;
    var src;
    var fn;
    var opts = this.opts;
    var prepended = '';
    var appended = '';
    var escapeFn = opts.escapeFunction;

    if (!this.source) {
      this.generateSource();
      prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
      if (opts._with !== false) {
        prepended +=  '  with (' + opts.localsName + ' || {}) {' + '\n';
        appended += '  }' + '\n';
      }
      appended += '  return __output.join("");' + '\n';
      this.source = prepended + this.source + appended;
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' + '\n'
          + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
          + '  , __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') + ';' + '\n'
          + 'try {' + '\n'
          + this.source
          + '} catch (e) {' + '\n'
          + '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
          + '}' + '\n';
    }
    else {
      src = this.source;
    }

    if (opts.client) {
      src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
      }
    }

    if (opts.strict) {
      src = '"use strict";\n' + src;
    }
    if (opts.debug) {
      console.log(src);
    }

    var fnArgsNames = this.generateArgumentNames(opts);
    try {
      fn = new Function(fnArgsNames.join(','), src);
    }
    catch(e) {
      // istanbul ignore else
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs\n\n';
        e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
        e.message += 'https://github.com/RyanZim/EJS-Lint';
      }
      throw e;
    }

    if (opts.client) {
      fn.dependencies = this.dependencies;
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    // Adds a local `include` function which allows full recursive include
    var returnedFn = function (data, callerFnArgs) {
      var fnArgs;
      var include = function (path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d, fnArgs);
      };
      fnArgs = self.generateArguments(data, opts, {
        escapeFn: escapeFn,
        include: include,
      }, callerFnArgs || {});
      var fnArgsList = fnArgsNames.map(function(k) { return fnArgs[k]; });
      return fn.apply(opts.context, fnArgsList);
    };
    returnedFn.dependencies = this.dependencies;
    return returnedFn;
  },

  generateArgumentNames: function (opts) {
    return [opts.localsName, 'escapeFn', 'include', 'rethrow'];
  },

  generateArguments: function (data, opts, ejsArgs) {
    var r = {
      escapeFn: ejsArgs.escapeFn,
      include: ejsArgs.include,
      rethrow: rethrow,
    };
    r[opts.localsName] = data || {};
    return r;
  },

  generateSource: function () {
    var opts = this.opts;

    if (opts.rmWhitespace) {
      // Have to use two separate replace here as `^` and `$` operators don't
      // work well with `\r`.
      this.templateText =
        this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
    }

    var str = this.templateText;
    var patTag = this.regexNextTag;
    var patLit = this.regexLiteral;
    var replLit = this.regexLiteralReplace;

    var tagClose;
    var result = patTag.exec(str);
    while (result) {
      if (result[4]) {
        throw new Error('Found close tag "' + result[4] + '" without matching opening tag.');
      }

      var txtBefore = result[1];
      var tagOpen = result[3]||'';
      str = str.slice(result[0].length);
      if (result[2] !== undefined) {
        txtBefore = txtBefore.replace(patLit, replLit);
      }

      this.scanTextLine(txtBefore, tagClose, tagOpen);

      if (result[7] === undefined) {
        throw new Error('Could not find matching close tag for "<' + this.opts.delimiter + tagOpen + '".');
      }
      var tagContent =  result[5];
      if (result[6] !== undefined) {
        tagContent = tagContent.replace(patLit, replLit);
      }
      tagClose = result[7] || '';
      this.scanTagLine(tagOpen, tagContent, tagClose);

      result = patTag.exec(str);
    }

    if (str) {
      str = str.replace(patLit, replLit);
      this.scanTextLine(str, tagClose);
    }
    this._srcAdd('');
  },

  _srcAppend: function (line) {
    if (! this.__inAppend) {
      this.source += '    ; __append(';
      this.__inAppend = true;
    }
    else {
      this.source += ', ';
    }
    this.source += line;
  },

  _srcAdd: function (line) {
    if (this.__inAppend) {
      this.source += ')' + '\n';
      this.__inAppend = false;
    }
    this.source += line;
  },

  _addOutput: function (line) {
    if (this.opts.rmWhitespace) {
      // rmWhitespace has already removed trailing spaces, just need
      // to remove linebreaks
      line = line.replace(/^\n/, '');
    }
    if (!line) {
      return line;
    }

    // Preserve literal slashes
    line = line.replace(/\\/g, '\\\\');

    // Convert linebreaks
    line = line.replace(/\n/g, '\\n');
    line = line.replace(/\r/g, '\\r');

    // Escape double-quotes
    // - this will be the delimiter during execution
    line = line.replace(/"/g, '\\"');
    this._srcAppend('"' + line + '"');
  },

  scanTextLine: function (line, prevCloseTag, nextOpenTag) {
    var newLineCount = this.opts.compileDebug && (line.split('\n').length - 1);
    if (prevCloseTag === '-') {
      line = line.replace(/^(?:\r\n|\r|\n)/, '');
    }
    else if (prevCloseTag === '_') {
      line = line.replace(/^[ \t]*(?:\r\n|\r|\n)?/, '');
    }
    if (nextOpenTag === '_') {
      line = line.replace(/[ \t]+$/, '');
    }
    this._addOutput(line);
    if (this.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this._srcAdd('    ; __line = ' + this.currentLine + '\n');
    }
  },

  scanTagLine: function (openTag, line /*, closeTag*/) {
    var self = this;
    var newLineCount = this.opts.compileDebug && (line.split('\n').length - 1);

    this.mode = this.modeMap[openTag];

    // If '//' is found without a line break, add a line break.
    switch (this.mode) {
    case exports.modes.EVAL:
    case exports.modes.RAW:
      // HACK: backward-compat `include` preprocessor directives
      var include = line.match(/^\s*include\s+(\S+)/);
      if (include) {
        var includeSrc;
        var includeOpts = utils.shallowCopy({}, self.opts);
        var includeObj = includeSource(include[1], includeOpts);
        if (self.opts.compileDebug) {
          includeSrc =
              '    ; (function(){' + '\n'
              + '      var __line = 1' + '\n'
              + '      , __lines = ' + JSON.stringify(includeObj.template) + '\n'
              + '      , __filename = ' + JSON.stringify(includeObj.filename) + ';' + '\n'
              + '      try {' + '\n'
              + includeObj.source
              + '      } catch (e) {' + '\n'
              + '        rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
              + '      }' + '\n'
              + '    ; }).call(this)' + '\n';
        }else{
          includeSrc = '    ; (function(){' + '\n' + includeObj.source +
              '    ; }).call(this)' + '\n';
        }
        this._srcAdd(includeSrc);
        self.dependencies.push(exports.resolveInclude(include[1],
            includeOpts.filename));
        this.mode = null; // skip normal handling
        break;
      }
      // END HACK include
      if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
        line += '\n';
      }
      break;
    case exports.modes.ESCAPED:
      if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
        line += '\n';
      }
    }

    switch (this.mode) {
        // Just executing code
    case exports.modes.EVAL:
      this._srcAdd('    ; ' + line + '\n');
      break;
        // Exec, esc, and output
    case exports.modes.ESCAPED:
      this._srcAppend('escapeFn(' + stripSemi(line) + ')');
      break;
        // Exec and output
    case exports.modes.RAW:
      this._srcAppend(stripSemi(line));
      break;
    case exports.modes.COMMENT:
          // Do nothing
      break;
    case null:
      break;
    default:
      throw new Error('Tag with unknown mode '+this.mode+' ('+openTag+')');
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this._srcAdd('    ; __line = ' + this.currentLine + '\n');
    }

    this.mode = null;
  },

};

exports.Template = Template;

/**
 * Escape characters reserved in XML.
 *
 * This is simply an export of {@link module:utils.escapeXML}.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @public
 * @func
 * */
exports.escapeXML = utils.escapeXML;

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */

exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if (require.extensions) {
  require.extensions['.ejs'] = function (module, flnm) {
    var filename = flnm || /* istanbul ignore next */ module.filename;
    var options = {
      filename: filename,
      client: true
    };
    var template = fileLoader(filename).toString();
    var fn = exports.compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

/**
 * Version of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.VERSION = _VERSION_STRING;

/**
 * Name for detection of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.name = _NAME;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}
