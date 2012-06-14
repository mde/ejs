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
  , TemplateNode = require('./template_node').TemplateNode
  , Templater
  , getFileName
  , getDirName
  , getTemplateData;

/**
 * Templating constructor
 * @constructor
 */
Templater = function() {
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

// Main render function that renders pages from a layout and template(s)
Templater.prototype.render = function(data, config) {
  var templateFileName;

  // Rendering a template in a layout
  if(config.layout) {
    this.isLayout = true;
    this.templateRoot = getDirName(config.layout);
    templateFileName = getFileName(config.layout);

    var self = this
      , templaterContent = new Templater()
      , contentPartial = '';

    // Add template content to buffer
    templaterContent.addListener('data', function(content) {
      // Define `yield` method
      // TODO: Move into some external module called 'helpers'
      data.yield = function() {
        return contentPartial;
      };

      contentPartial += content;
    });

    // Once template has been rendered create a partial for the layout
    templaterContent.addListener('end', function() {
      self.partial(templateFileName, data);
    });

    // Render the template
    templaterContent.render(data, {template: config.template});
  }
  // Rendering a template
  else {
    this.templateRoot = getDirName(config.template);
    templateFileName = getFileName(config.template);

    this.partial(templateFileName, data); // Create partial from template
  }
};

// Main partial function that renders a template or layout file(or cache)
Templater.prototype.partial = function(partialURL, renderContextParam, parentNode) {
  var self = this
    , partialId = this.currentPartialId
    , isBaseNode = !this.baseTemplateNode
    , renderContext = renderContextParam || {}
    , node
    , templateData;

  // Get template data object from template registry
  templateData = getTemplateData(this.templateRoot, partialURL, parentNode, this.isLayout);

  // Create the current node, with reference to parent, if parent exists
  node = new TemplateNode(partialId, templateData, renderContext, parentNode);

  // Create helper function that will create partials from a template
  renderContext.partial = function(partUrl, ctxt) {
    return self.partial.call(self, partUrl, ctxt, node);
  };

  // If a parent node exists add current node as a child
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

// Return the file name for a path
getFileName = function(path) {
  return path.split('/').pop();
};

// Return the first parent for a path
getDirName = function(path) {
  path = path.split('/');
  path.pop();
  return path.join('/');
};

// Return the template object for a template from geddy's template registry
getTemplateData = function(templateRoot, partialURL, parentNode, isLayout) {
  var dirs = []
    , dir
    , key
    , templateData;

  // If it's a sub template, then look in the parent's directory
  if(parentNode) dirs.push(parentNode.dirname);
  // Add template root to directory list
  dirs.push(path.normalize(templateRoot));
  // Add the base views directory to the list
  dirs.push(path.normalize('app/views'));

  // Loop through dirs until a registered template path is found
  // Note: Template paths are gathered at init so we don't have to touch the FS
  //       - when looking for templates
  var i;
  for(i in dirs) {
    dir = dirs[i];
    key = path.normalize(dir + '/' + partialURL); // Not full path(No extension(s))

    if(geddy.templateRegistry[key] && geddy.templateRegistry[key].registered) {
      templateData = geddy.templateRegistry[key];
      break;
    }
  }

  // No template has been found
  if(!templateData) {
    var err;

    // If it's a layout attempt to find the default layout
    if(isLayout) {
      templateData = path.normalize('app/views/layouts/application');
      // Should be true if the default layout exists
      if(templateData in geddy.templateRegistry) {
        templateData = geddy.templateRegistry[templateData];
      }
      // If default layout doesn't exist we have no other layout so throw error
      else {
        err = new geddy.errors.InternalServerError('Layout template "' +
              partialURL + '" not found in ' + geddy.utils.array.humanize(dirs));
        throw err;
      }
    }
    // If it's a normal template then it doesn't exist
    else {
      err = new geddy.errors.InternalServerError('Partial template "' +
            partialURL + '" not found in ' + geddy.utils.array.humanize(dirs));
      throw err;
    }
  }

  return templateData;
};

exports.Templater = Templater;
