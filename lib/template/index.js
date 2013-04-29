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
  , fs = require('fs')
  , utils = require('utilities')
  , Adapter = require('./adapters').Adapter
  , Templater
  , Partial
  , Layout
  , getFileName
  , getDirName
  , getTemplateData
  , cache = {};


// Return the file name for a path
getFileName = function (p) {
  return p.split('/').pop();
};


Templater = function () {
};

Templater.prototype = new (function () {
  this.render = function (data, config, cb) {
    // Register data to helpers, and register the helpers to the adapter
    geddy.viewHelpers.registerData(data);
    Adapter.registerHelpers(geddy.viewHelpers);

    var layout = new Layout(config.layout, config.template, data);
    layout.render(cb);
  };
})();
exports.Templater = Templater;

Partial = function (templatePath, data, parent) {
  var self = this;
  this.id = utils.string.uuid();
  this.templatePath = templatePath
  this.data = data;
  this.parent = parent;
  this.children = [];
  this.content = '';

  this.data.partial = function (templatePath, data) {
    var child = self.addChild(templatePath, data);
    return '###partial###' + child.id
  };
};

Partial.prototype = new (function () {

  this.render = function (cb) {
    var self = this
      , templateData = this.getTemplateData()
      , file = templateData.file
      , ext = templateData.ext
      , handleData = function (data) {
          self.renderSelf(data, ext);
          self.renderChildren(cb);
        };

    // Use cached template content if possible
    if (cache[file]) {
      handleData(cache[file]);
    }
    // Otherwise fetch off disk
    else {
      // Get the template from the FS then cache it for subsequent requests
      fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
          throw err;
        }
        if (geddy.config.environment != 'development') {
          cache[file] = data;
        }
        handleData(data);
      });
    }
  };

  this.renderSelf = function (templateContent, ext) {
    var adapter = new Adapter();
    // Render with appropriate engine
    adapter.set({engine: ext, template: templateContent});
    this.content = adapter.render(this.data);
  };

  this.renderChildren = function (cb) {
    var self = this
      , children = this.children
      , incr = children.length;

    if (children.length) {
      children.forEach(function (child) {
        child.render(function (content) {
          self.content = self.content.replace(
              '###partial###' + child.id, content);
          incr--;
          if (!incr) {
            cb(self.content);
          }
        });
      });
    }
    else {
      cb(this.content);
    }

  };

  this.getTemplateData = function () {
    var dirs = []
      , dir
      , key
      , templatePath = this.templatePath
      , templateData;

    // Look for an exact match
    templateData = geddy.templateRegistry[templatePath];
    if (!templateData) {
      // Loop through dirs until a registered template path is found
      // Note: Template paths are gathered at init so we don't have to
      // touch the FS when looking for templates

      // If this is a child partial, then look in the parent's directory
      if (this.parent) {
        dirs.unshift(path.dirname(this.parent.templatePath));
      }

      // Any local template directory
      dirs.unshift(path.dirname(templatePath));

      // Last resort; look in the base views directory
      dirs.unshift(path.normalize('app/views'));


      for (var i = 0, ii = dirs.length; i < ii; i++) {
        dir = dirs[i];
        // Not full path (No extension(s))
        key = path.normalize(path.join(dir, templatePath));

        templateData = geddy.templateRegistry[key];
        if (templateData) {
          break;
        }
      }
    }

    // Still no joy
    if (!templateData) {
      // If this is a Layout partial, try to use the default
      if (this instanceof Layout) {
        key = path.normalize('app/views/layouts/application');
        // Should be true if the default layout exists
        templateData = geddy.templateRegistry[key];
        // If they've removed the default layout for some reason
        if (!templateData) {
          throw new geddy.errors.InternalServerError('Layout template "' +
                templatePath + '" not found in ' +
                geddy.utils.array.humanize(dirs));
        }
      }
      // If it's a normal Partial then it doesn't exist, boom
      else {
        throw new geddy.errors.InternalServerError('Partial template "' +
              templatePath + '" not found in ' +
              geddy.utils.array.humanize(dirs));
      }
    }

    return templateData || null;
  };

  this.addChild = function (templatePath, data) {
    var child = new Partial(templatePath, data, this);
    this.children.push(child);
    return child;
  };

})();

Layout = function (layoutPath, templatePath, data) {
  var self = this;

  Partial.call(this, layoutPath, data, null);

  this.partialLayoutPath = templatePath;

  data.yield = function () {
    return self.data.partial(self.partialLayoutPath, data);
  };
};

Layout.prototype = Object.create(Partial.prototype);
Layout.prototype.constructor = Layout;

exports.Templater = Templater;
