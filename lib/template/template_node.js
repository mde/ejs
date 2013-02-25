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
  , path = require('path')
  , engine = {cache: {}};

engine.TemplateNode = function (id, data, params, parentNode, adapter) {
  this.id = id;
  this.data = data;
  this.dirname = path.dirname(data.file);
  this.params = params;
  this.parentNode = parentNode || null;
  this.loaded = false;
  this.cachedFinish = false;
  this.childNodes = {};
  this.content = null;
  this.adapter = adapter;
};

engine.TemplateNode.prototype = new function () {

  // Only root remplate nodes get this method
  // This method sends back the complete content back for the response
  this.finishRoot = null;

  var _createLoader = function (node) {
    return function () { node.loadTemplate.call(node); };
  };

  this.childFinished = function (childNode) {
    this.content = this.content.replace(
        '###partial###' + childNode.id, childNode.content);

    // When a child node is finished, this node may be finished
    this.tryFinish();
  };

  this.tryFinish = function () {
    // If this node is finished, either call up the chain, or
    // finish up the entire template
    if (this.isFinished()) {
      if (this.parentNode) {
        this.parentNode.childFinished(this);
      } else {
        this.finishRoot();
      }
    }
  };

  this.loadChildTemplates = function () {
    var childNodes = this.childNodes;

    for (var p in childNodes) {
      geddy.async.execNonBlocking(_createLoader(childNodes[p]));
    }
  };

  this.isFinished = function () {
    // May be a recursive check in child nodes -- if not loaded, it isn't finished
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

    // Once finished cache results to avoid other recursive calls when it's
    // called as a child
    this.cachedFinish = true;
    return true;
  };

  this.loadTemplate = function () {
    var self = this
      , cached;

    var handleLoaded = function (content) {
      self.loaded = true;
      self.params.template = self.data;
      self.adapter.set({engine: self.data.ext, template: content, baseNamePath: self.params.template.baseNamePath});
      self.content = self.adapter.render(self.params);

      // By the time we get here, all 'partial' method calls will
      // have executed, and any children will have been added
      self.loadChildTemplates();

      // This node is loaded, and we now know if it has any children
      // -- it may be finished, too.
      self.tryFinish();
    };

    // Use cached template if exists and if not in development
    if (geddy.config.environment !== 'development') {
      cached = engine.cache[this.data.baseNamePath];

      if (cached) {
        handleLoaded(cached);
      }
    }

    // Get the template from the FS then cache it for subsequent requests
    fs.readFile(this.data.file, 'utf8', function (err, content) {
      if (geddy.config.environment !== 'development') {
        engine.cache[self.data.baseNamePath] = content;
      }

      handleLoaded(content);
    });
  };

}();

exports.TemplateNode = engine.TemplateNode;
