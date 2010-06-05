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

var sys = require('sys');
var fs = require('fs');
var path = require('path');
var fleegix = require('./fleegix');
var async = require('geddy-util/lib/async');

var templates = {};

templates.TemplateNode = function (id, url, params, parentNode) {
  this.id = id;
  this.url = url;
  this.dirname = path.dirname(url);
  this.params = params;
  this.parentNode = parentNode || null;
  this.loaded = false;
  this.childNodes = {};
  this.content = null;
};

templates.TemplateNode.prototype = new function () {
  // Only the root template node gets this -- it's the function that
  // passes the completed content back to be written out in the response
  this.finishRoot = null;
  
  this.finish = function (source) {
    // If this finish is being called by one of the children,
    // replace its placeholder text with the child's actual content
    if (source) {
      this.content = this.content.replace(
          '###partial###' + source.id, source.content);
    }
    // This should never happen, but whatever
    if (!this.loaded) {
      return false;
    }
    // If any of the child nodes of this parent haven't loaded yet,
    // bail out -- this will get re-called every time one of them
    // comes in, until they're all there and we can move on up the chain
    var childNodes = this.childNodes;
    for (var p in childNodes) {
      if (!childNodes[p].loaded) {
        return false;
      }
    }
    // If this is not the base node, call up the chain
    if (this.parentNode) {
      this.parentNode.finish(this);
    }
    // Otherwise, it's the root node -- time to write out the response
    else {
      this.finishRoot();
    }
  };

  this.loadChildTemplates = function () {
    var childNodes = this.childNodes;
    var childNode;
    for (var p in childNodes) {
      childNode = childNodes[p];
      async.execNonBlocking(function () { childNode.loadTemplate(); });
    }
  };
  
  this.loadTemplate = function () {
    var _this = this;
    fs.readFile(this.url, 'utf8', function (err, data) {
      if (err) { throw err; }
      // Create a template out of the markup in the file
      var templ = new fleegix.ejs.Template({text: data});
      
      // Execute the template with the content as the data-object
      // This may execute "partial" method calls that create child
      // nodes for this one.
      templ.process({data: _this.params});
      
      _this.content = templ.markup;

      // By the time we get here, all 'partial' method calls will
      // have executed, and any children will have been added
      _this.loadChildTemplates();
      
      // Send the finish call -- a node can call finish on its parent
      // if it either has no children, or all its children have loaded.
      // The parent will do the same thing until we get to the base node
      _this.loaded = true;
      async.execNonBlocking(function () { _this.finish(); });
    });

  };

}();

exports.TemplateNode = templates.TemplateNode;
