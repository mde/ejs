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

var util = require('util')
  , fs = require('fs')
  , path = require('path')
  , utils = require('../../../utils');

var ejs = {};

ejs.TemplateNode = function (id, url, params, parentNode) {
  this.id = id;
  this.url = url;
  this.dirname = path.dirname(url);
  this.params = params;
  this.parentNode = parentNode || null;
  this.loaded = false;
  this.cachedFinish = false;
  this.childNodes = {};
  this.content = null;
};

ejs.TemplateNode.prototype = new function () {
  // Only the root template node gets this -- it's the function that
  // passes the completed content back to be written out in the response
  this.finishRoot = null;

  this.childFinished = function (childNode) {
    this.content = this.content.replace(
        '###partial###' + childNode.id, childNode.content);

    // Every time a child node finished, this node may actually
    // be finished
    this.tryFinish();
  };

  this.tryFinish = function () {
    // If this node is actually finished, either call up the
    // chain, or finish the entire thing out
    if (this.isFinished()) {
      if (this.parentNode) {
        this.parentNode.childFinished(this);
      }
      else {
        this.finishRoot();
      }
    }
  };

  var _createLoader = function (node) {
    return function () { node.loadTemplate.call(node); };
  };

  this.loadChildTemplates = function () {
    var childNodes = this.childNodes;
    var childNode;
    for (var p in childNodes) {
      childNode = childNodes[p];
      utils.async.execNonBlocking(_createLoader(childNode));
    }
  };

  this.isFinished = function () {
    // May be a recursive check down into a child -- if the child
    // is not loaded, it's not finished
    if (!this.loaded) {
      return false;
    }

    // If we've already closed this node out, use the cached finish-flag
    if (this.cachedFinish) {
      return true;
    }

    // If any of the child nodes of this parent haven't loaded yet,
    // bail out -- this will get re-called every time one of them
    // comes in, until they're all there and we can move on up the chain
    var childNodes = this.childNodes;
    for (var p in childNodes) {
      if (!childNodes[p].isFinished()) {
        return false;
      }
    }
    // Once this guy is finished cache the results to avoid

    // a bunch of recursive calls when it's called as a child
    this.cachedFinish = true;

    return true;
  };

  this.loadTemplate = function () {
    var _this = this;

    var handleLoaded = function (data) {
      _this.loaded = true;

      // Create a template out of the markup in the file
      var templ = new ejs.Template({text: data});

      // Execute the template with the content as the data-object
      // This may execute "partial" method calls that create child
      // nodes for this one.
      templ.process({data: _this.params});

      _this.content = templ.markup;

      // By the time we get here, all 'partial' method calls will
      // have executed, and any children will have been added
      _this.loadChildTemplates();

      // This node is loaded, and we now know if it has any children
      // -- it may be finished, too.
      _this.tryFinish();
    };

    var cached = ejs.textCache[this.url];
    // Use cached template text if possible
    if (geddy.config.environment == 'production' && cached) {
      handleLoaded(cached);
    }
    // If this is the first hit, use the template text off disc
    // and cache it for subsequent requests
    else {
      fs.readFile(this.url, 'utf8', function (err, data) {
        if (err) { throw err; }
        ejs.textCache[_this.url] = data;
        handleLoaded(data);
      });
    }

  };

}();

ejs.Template = function (p) {
  var UNDEF;
  var params = p || {};

  this.mode = null;
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
  var _REGEX = /(<%%)|(%%>)|(<%=)|(<%#)|(<%)|(%>\n)|(%>)|(\n)/;
  this.modes = {
    EVAL: 'eval',
    OUTPUT: 'output',
    APPEND: 'append',
    COMMENT: 'comment',
    LITERAL: 'literal'
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
    var _this = this;
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
        _this.templateText = s;
        ejs.templateTextCache[url] = s;
        // Use afterLoaded hook if set
        if (typeof _this.afterLoaded == 'function') {
          _this.afterLoaded();
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
  this.process = function (p) {
    var params = p || {};
    this.data = params.data || {};
    var domNode = params.node;
    // Cache/reuse the generated template source for speed
    this.source = this.source || '';
    if (!this.source) { this.generateSource(); }

    // Eval the template with the passed data
    // Use 'with' to give local scoping to data obj props
    // ========================
    var _output = ''; // Inner scope var for eval output
    with (this.data) {
      eval(this.source);
    }
    this.markup = _output;

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
    var _this = this;
    var _addOutput = function () {
      line = line.replace(/\n/, '\\n');
      line = line.replace(/"/g, '\\"');
      _this.source += '_output += "' + line + '";';
    };
    switch (line) {
      case '<%':
        this.mode = this.modes.EVAL;
        break;
      case '<%=':
        this.mode = this.modes.OUTPUT;
        break;
      case '<%#':
        this.mode = this.modes.COMMENT;
        break;
      case '<%%':
        this.mode = this.modes.LITERAL;
        this.source += '_output += "' + line + '";';
        break;
      case '%>':
      case '%>\n':
        if (this.mode == this.modes.LITERAL) {
          _addOutput();
        }
        this.mode = null;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          switch (this.mode) {
            // Just executing code
            case this.modes.EVAL:
              this.source += line;
              break;
            // Exec and output
            case this.modes.OUTPUT:
              // Add the exec'd result to the output
              this.source += '_output += ' + line + ';';
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
    }
  };
};

module.exports = ejs;
