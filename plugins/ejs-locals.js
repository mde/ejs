/*
 * Based on the functionality of https://github.com/RandomEtc/ejs-locals
 *
 * Changes to filename lookup:
 * * partial
 *   For relative path, it will first check as ejs-locals does, then also try
 *     to resovle as ejs does for includes
 *   For absolute path it will search in opts.root (if set, otherwise /).
 *     ejs-locals would always go to /
 *     It will also continue the search with ejs' include method.
 *
 * * layout
 *   Lookup of any filename follows the current rules of ejs, instead of the
 *     rules of ejs-locals
 *     Files with an absolute path (starting with / ):
 *       ejs: will search in opts.root
 *       ejs-locals: for layouts it did search in opts.views, so for compatibility set opts.root
 *
 */

'use strict';
var ejs = require('../lib/ejs');
var utils = require('../lib/utils');
var path = require('path');

var EjsTemplate = ejs.Template;

function LocalsTemplate(text, opts) {
  EjsTemplate.call(this, text, opts);
}

LocalsTemplate.prototype = Object.create(EjsTemplate.prototype);

LocalsTemplate.prototype.compile = function () {
  var opts = this.opts;
  var fn = EjsTemplate.prototype.compile.apply(this, arguments);
  if (opts.client) {
    return fn;
  }

  var self = this;
  var newFn = function (data, callerFnArgs) {
    callerFnArgs = callerFnArgs || {};

    if (! callerFnArgs.block) {
      var blocks = { scripts: undefined, stylesheets: undefined };
      callerFnArgs.blocks = blocks;
      callerFnArgs.block = block.bind(blocks);
      callerFnArgs.script = script.bind(blocks);
      callerFnArgs.stylesheet = stylesheet.bind(blocks);
    }
    var topLevel = !callerFnArgs.layout;
    var layoutName = {};
    if (topLevel) {
      callerFnArgs.layout = layout.bind(layoutName);
    }

    callerFnArgs.partial = function (partialPath, partialData) {
      partialData = partialData || {};

      var collection = partialData.collection;
      delete partialData.collection;
      if(! collection && ('length' in partialData)) {
        collection = partialData;
        partialData = {};
      }

      var object = partialData;
      if (object.constructor && object.constructor.name !== 'Object') {
        partialData = {};
      } else {
        object = partialData.object;
        delete partialData.object;
      }

      var d = utils.shallowCopy(utils.shallowCopy({}, data), partialData);

      var as = partialData.as
      || partialPath.replace(/^.*\/[^a-zA-Z0-9]*|[^a-zA-Z0-9]+\.[^.]*$/g, '')
      .replace(/[^a-zA-Z0-9]+([a-zA-Z0-9]?)/g, function(m,c) { return c.toUpperCase(); });

      var home = path.dirname(opts.filename) || opts.root || '/';
      if (partialPath.charAt(0) == '/') {
        partialPath = partialPath.substr(1);
        home = opts.root || '/';
      }
      var dir = path.dirname(partialPath);
      var base = path.basename(partialPath);

      // search for files in the order of: path/_file, path/file, path/file/index, ejs resolve of path
      var t = ejs.resolveInclude(path.join(dir, '_'+base), home, true);
      if (ejs.fileExists(t)) {
        partialPath = t;
      }
      else {
        t = ejs.resolveInclude(partialPath, home, true);
        if (ejs.fileExists(t)) {
          partialPath = t;
        }
        else {
          t = ejs.resolveInclude(path.join(dir,base, 'index'), home, true);
          if (ejs.fileExists(t)) {
            partialPath = t;
          }
          else {
            partialPath = ejs.getIncludePath(partialPath, opts);
          }
        }
      }

      var o = utils.shallowCopy({}, opts);
      o.filename = partialPath;

      function callTmpl(key, idx) {
        d.firstInCollection = idx === 0;
        d.indexInCollection = idx;
        d.lastInCollection = idx === d.collectionLength - 1;
        d[as] = collection[key];
        return ejs.handleCache(o)(d, callerFnArgs);
      }
      if (collection) {
        var len = collection.length;
        var r = '';
        var i;
        if (typeof len == 'number' || Array.isArray(collection)) {
          d.collectionLength = len;
          for (i = 0; i < len; ++i) {
            r = r + callTmpl(i,i);
          }
        }
        else{
          var keys = Object.keys(collection);
          len = keys.length;
          d.collectionLength = len;
          d.collectionKeys = keys;
          for (i = 0; i < len; ++i) {
            d.keyInCollection = keys[i];
            r = r + callTmpl(keys[i],i);
          }
        }
        return r;
      }
      else {
        if (object) {
          d[as] = object;
        }
        return ejs.handleCache(o)(d, callerFnArgs);
      }
    };

    var r = fn.call(self, data, callerFnArgs);

    if (topLevel) {
      var layoutPath = layoutName.name;
      if (data && layoutPath === undefined) {
        layoutPath = data._layoutFile;
      }
      if (layoutPath) {
        if (layoutPath === true) {
          layoutPath = '/layout';
        }

        data = utils.shallowCopy({}, data);
        opts = utils.shallowCopy({}, opts);
        if (data) {
          delete data._layoutFile;
        }

        data.body = r;
        r = ejs.includeFile(layoutPath, opts)(data, { block: callerFnArgs.block, script: callerFnArgs.script, stylesheet: callerFnArgs.stylesheet, blocks: callerFnArgs.blocks });
      }
    }

    return r;
  };
  newFn.dependencies = fn.dependencies;
  return newFn;
};

LocalsTemplate.prototype.generateArgumentNames = function () {
  var r = EjsTemplate.prototype.generateArgumentNames.apply(this, arguments);
  if (this.opts.client) {
    return r;
  }
  return r.concat(['layout', 'partial', 'block', 'stylesheet', 'script', 'blocks']);
};

LocalsTemplate.prototype.generateArguments = function (data, opts, ejsArgs, callerFnArgs) {
  var r = EjsTemplate.prototype.generateArguments.apply(this, arguments);
  if (this.opts.client) {
    return r;
  }

  r.layout     = callerFnArgs.layout;
  r.block      = callerFnArgs.block;
  r.blocks     = callerFnArgs.blocks;
  r.script     = callerFnArgs.script;
  r.stylesheet = callerFnArgs.stylesheet;
  r.partial    = callerFnArgs.partial;

  return r;
};


function layout(layoutName) {
  this.name = layoutName;
}

function block(name, html) {
  if (html) {
    this[name] = this[name] === undefined ? html : [this[name], html].join('\n');
  }
  return this[name] || '';
}

function script(path, type) {
  if (path) {
    path = '<script src="'+path+'"'+(type ? ' type="'+type+'"' : '')+'></script>';
    this.scripts = this.scripts === undefined ? path : [this.scripts, path].join('\n');
  }
  return this.scripts || '';
}

function stylesheet(path, media) {
  if (path) {
    path = '<link rel="stylesheet" href="'+path+'"'+(media ? ' media="'+media+'"' : '')+' />';
    this.stylesheets = this.stylesheets === undefined ? path : [this.stylesheets, path].join('\n');
  }
  return this.stylesheets || '';
}

ejs.Template = LocalsTemplate;
