'use strict';
var ejs = require('../lib/ejs');
//var utils = require('../lib/utils');

var EjsTemplate = ejs.Template;

module.exports.keepOnlyOpts; // [list of opts]

module.exports.removeOpts = [];

module.exports.optsDefaults = {};

function OptsFilterTemplate(text, opts) {
  opts = opts || {};
  if (Array.isArray(module.exports.keepOnlyOpts)) {
    Object.keys(opts).forEach(function(k) {
      if (module.exports.keepOnlyOpts.indexOf(k) < 0) {
        delete opts[k];
      }
    });
  }

  if (Array.isArray(module.exports.removeOpts)) {
    module.exports.removeOpts.forEach(function(k) {
      delete opts[k];
    });
  }

  Object.keys(module.exports.optsDefaults).forEach(function(k) {
    if (! opts.hasOwnProperty(k)) {
      opts[k] = module.exports.optsDefaults[k];
    }
  });

  EjsTemplate.call(this, text, opts);
}

OptsFilterTemplate.prototype = Object.create(EjsTemplate.prototype);

ejs.Template = OptsFilterTemplate;
