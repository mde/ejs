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

var errors = require('../../../errors')
  , TemplaterBase = require('../../templater_base').TemplaterBase
  , EventEmitter = require('events').EventEmitter
  , TemplateNode = require('./template_node').TemplateNode;

/**
 * EJS templater constructor
 * @contstructor
 */
var Templater = function () {
  this.currentPartialId = 0;
  this.baseTemplateNode = undefined;
  this.templateRoot = undefined;
  this.isLayout = false;
};

// Inherit from TemplaterBase
Templater.prototype = new TemplaterBase();

// Override the TempaterBase render method
Templater.prototype.render = function (data, config) {

  if (config.layout) {

    this.isLayout = true;
    this.templateRoot = getDirname(config.layout);

    var _this = this;
    var templaterContent = new Templater();
    var contentPartial = '';

    templaterContent.addListener('data', function (d) {
      // Buffer for now, but could stream
	    contentPartial += d;
    });

    templaterContent.addListener('end', function () {
      data.yield = function () { return contentPartial; };
      _this.partial(getFilename(config.layout), data);
    });

    templaterContent.render(data, {template: config.template});
  }

  else {
	 // Set the base path to look for template partials
	 this.templateRoot = getDirname(config.template);
	 filename = getFilename(config.template);
   this.partial(filename, data);
  }
};

var getFilename = function (path) {
  return path.split('/').pop();
};

var getDirname = function (path) {
  var arr = path.split('/');
  arr.pop();
  return arr.join('/');
};

var getTemplateUrl = function (templateRoot, partialUrl, parentNode, isLayout) {
  var key
    , templateUrl
    , dirs = []
    , dir
    , err;

  // If this is a sub-template, try in the same directory as the the parent
  if (parentNode) {
    dirs.push(parentNode.dirname);
  }

  // Or look in the specified the templateRoot
  dirs.push(templateRoot);

  // Look through the directory list until you find a registered
  // template path -- these are registered during app init so we're
  // not touching the filesystem every time to look for partials
  for (var i = 0, ii = dirs.length; i < ii; i++) {
    dir = dirs[i];
    key = dir + '/' + partialUrl + '.html.ejs';
    if (geddy.templateRegistry[key]) {
      templateUrl = key;
      break;
    }
  }

  // No template
  if (!templateUrl) {
    // If it's a layout, use the default one for the app
    if (isLayout) {
      templateUrl = 'app/views/layouts/application.html.ejs';
    }
    // Bail out if a normal content template
    else {
      err = new errors.InternalServerError('Partial template "' +
          partialUrl + '" not found in ' + dirs.join(", "));
      throw err;
    }
  }

  return templateUrl;
};

Templater.prototype.partial = function (partialUrl, renderContext, parentNode) {

  var _this = this,
      node,
      partialId = this.currentPartialId,
      isBaseNode = !this.baseTemplateNode,
      templateUrl;

  templateUrl = getTemplateUrl(this.templateRoot, partialUrl, parentNode, this.isLayout);

  // Create the current node, with a reference to its parent, if any
  node = new TemplateNode(partialId, templateUrl, renderContext, parentNode);

  // Curry the partial method to use the current node as the
  // parent in subsequent recursive calls
  renderContext.partial = function (partUrl, ctxt) {
    return _this.partial.call(_this, partUrl, ctxt, node);
  };

  // If there is a parent, add this node as its child
  if (parentNode) {
    parentNode.childNodes[partialId] = node;
  }

  // If this is the base node (i.e., there's no baseTemplateNode yet),
  // give this node the finishRoot method that actually renders the final,
  // completed content for the entire template
  if (isBaseNode) {
    node.finishRoot = function () {

      _this.emit('data', _this.baseTemplateNode.content);
      _this.emit('end');

    }
    this.baseTemplateNode = node;
    // Kick off the hierarchical async loading process
    node.loadTemplate();
  }

  // Increment the current partial id for the next call
  this.currentPartialId++;

  // Return the placeholder text to represent this template -- it gets
  // replaced in the callback from the async load of the actual content
  return '###partial###' + partialId;
};


exports.Templater = Templater;
