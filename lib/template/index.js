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

var path = require('path')
  , EventEmitter = require('events').EventEmitter
  , TemplateNode = require('./template_node').TemplateNode;

/**
 * Templating constructor
 * @constructor
 */
var Templater = function() {
  this.currentPartialId = 0;
  this.baseTemplateNode = undefined;
  this.templateRoot = undefined;
  this.isLayout = false;
};

// Create event emitter and event types
Templater.prototype = new EventEmitter();
Templater.prototype.eventTypes = {
    DATA: 'data'
  , END: 'end'
};

// Create universal render function
Templater.prototype.render = function(data, config) {
  // Rendering a layout
  if (config.layout) {
    this.isLayout = true;
    this.templateRoot = getDirName(config.layout);

    var self = this
      , templaterContent = new Templater()
      , contentPartial = '';

    // Add incoming data to content buffer
    templaterContent.addListener('data', function(content) {
      contentPartial += content;
    });

    templaterContent.addListener('end', function() {
      // Define `yield` method
      // TODO: May remove if EJS supports it, or maybe create a helper module
      data.yield = function() {
        return contentPartial;
      };

      self.partial(getFileName(config.layout), data);
    });

    templaterContent.render(data, {template: config.template});
  }

  // Rendering a template
  else {
    var filename;

    this.templateRoot = getDirName(config.template);
    filename = getFileName(config.template);
    this.partial(filename, data);
  }
};

// Return a file name
var getFileName = function(path) {
  return path.split('/').pop();
};

// Return a directory name
var getDirName = function(path) {
  var arr = path.split('/');
  arr.pop();
  return arr.join('/');
};

var getTemplateUrl = function(templateRoot, partialUrl, parentNode, isLayout) {
  var key
    , templateData
    , dirs = []
    , dir
    , err;

  // If it's a sub-template, then try looking in the parent's directory
  if(parentNode) {
    dirs.push(parentNode.dirname);
  }

  // Look for the template in templateRoot
  dirs.push(path.normalize(templateRoot));
  // Look for template in the base views directory
  dirs.push(path.normalize('app/views'));

  // Loop through dircetory list until a registered template path
  // is found
  // Template paths are registered during init so we don't have to
  // touch the FS when looking for templates
  for(var i = 0, len = dirs.length; i < len; i++) {
    dir = dirs[i];
    // Not full path, add .html and extension to get full path
    key = dir + '/' + partialUrl;
    key = path.normalize(key);

    if(geddy.templateRegistry[key] && geddy.templateRegistry[key].registered) {
      templateData = geddy.templateRegistry[key];
      break;
    }
  }

  // No template has been found
  if(!templateData) {
    // If we're looking for a layout look for the default layout
    if (isLayout) {
      // TODO: Not sure how this works with other template engines yet
      // Jade, uses a built in system for handling layouts(block, extends)
      templateData = path.normalize('app/views/layouts/application');
      // Should be true if they have the default layout still present
      if(templateData in geddy.templateRegistry) {
        templateData = geddy.templateRegistry[templateData];
      }
    }
    // If it's a normal template then it doesn't exist
    else {
      var err = new geddy.errors.InternalServerError('Partial template "' +
          partialUrl + '" not found in ' + dirs.join(", "));
      throw err;
    }
  }

  return templateData;
};

Templater.prototype.partial = function(partialUrl, renderContextParam, parentNode) {
  var self = this
    , partialId = this.currentPartialId
    , isBaseNode = !this.baseTemplateNode
    , renderContext = renderContextParam || {}
    , node
    , templateData;

  templateData = getTemplateUrl(this.templateRoot, partialUrl, parentNode, this.isLayout);

  // Create the current node, with reference to parent, if parent exists
  // TODO: See how the template_node module works, may need to remove
  node = new TemplateNode(partialId, templateData, renderContext, parentNode);

  // Create an alias to the partial method that uses the current node as the
  // parent in future calls
  renderContext.partial = function(partUrl, ctxt) {
    return self.partial.call(self, partUrl, ctxt, node);
  };

  // If a parend node exists add current node as a child
  if(parentNode) parentNode.childNodes[partialId] = node;

  // If this is the base node(No baseTemplateNode yet) give this node
  // a finishRoot method that'll render the final, complete version
  // of the template
  if(isBaseNode) {
    // Emit the final content data
    node.finishRoot = function() {
      self.emit('data', self.baseTemplateNode.content);
      self.emit('end');
    };

    this.baseTemplateNode = node;
    node.loadTemplate(); // Start async loading process
  }

  // Increment current partial id for next partial
  this.currentPartialId++;

  // Return placeholder text to represent this specific template
  // It gets replaced in the callback from the async load of the content
  return '###partial###' + partialId;
};

exports.Templater = Templater;
