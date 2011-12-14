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

var fs = require('fs')
  , path = require('path');

var ejs = {};

ejs.Template = require('./template').Template;

ejs.textCache = {};

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
      geddy.async.execNonBlocking(_createLoader(childNode));
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
    if (geddy.config.environment != 'development' && cached) {
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

exports.TemplateNode = ejs.TemplateNode;

