var Partial
  , Layout
  , Adapter = require('./adapters').Adapter
  , path = require('path')
  , fs = require('fs')
  , utils = require('utilities')
  , cache = {};

Partial = function (templatePath, data, parent) {
  var self = this;
  this.id = utils.string.uuid();
  this.templatePath = templatePath
  this.data = data || {};
  this.parent = parent;
  this.children = [];
  this.content = '';

  // Hang a `partial` method on the execution-context for the
  // template rendering (e.g., will be the EJS global `partial`
  // function to add sub-templates
  this.data.partial = function (templatePath, data) {
    var child = new Partial(templatePath, data, self);
    self.addChild(child);
    return '###partial###' + child.id
  };
};

Partial.prototype = new (function () {

  this.getTemplateData = function () {
    var dirs = []
      , dir
      , key
      , templatePath = path.normalize(this.templatePath)
      , templateData;

    // Look for an exact match
    templateData = geddy.templateRegistry[templatePath];

    // No exact match, try with some directory prefixes
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
      // Is this a Layout?
      if (this instanceof Layout) {
        // Try to use the default application layout
        key = path.normalize('app/views/layouts/application');
        templateData = geddy.templateRegistry[key];
        // If they've removed the default layout for some reason
        if (!templateData) {
          throw new Error('Layout template "' + templatePath + '" not found in ' +
                utils.array.humanize(dirs));
        }
      }
      // If it's a normal Partial then it doesn't exist, boom
      else {
        throw new Error('Partial template "' + templatePath + '" not found in ' +
              utils.array.humanize(dirs));
      }
    }

    return templateData || null;
  };

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
          // Must replace $ with $$ otherwise capture groups screw up
          self.content = self.content.replace(
              '###partial###' + child.id, content.replace('$','$$$$'));
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

  this.addChild = function (child) {
    this.children.push(child);
  };

})();

exports.Partial = Partial;

// Layout is a subclass of Partial, depends on it
// being defined
Layout = require('./layout').Layout;

