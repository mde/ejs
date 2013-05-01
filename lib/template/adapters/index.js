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

var setOptions = function (options) {
  var opts = options || {}
    , self = this;

  this.options = opts.options || {};
  this.engineName = opts.engine || opts.engineName || '';

  this.engine = (function () {
    switch (self.engineName.replace('.', '')) {
    case 'ejs':
      return new (require('./ejs'));
    case 'jade':
      return new (require('./jade'));
    case 'mu':
    case 'ms':
    case 'mustache':
      self.engineName = 'mustache';
      return new (require('./mustache'));
    case 'hbs':
    case 'handlebars':
      self.engineName = 'handlebars';
      return new (require('./handlebars'));
    case 'swig':
      return new (require('./swig'));
    }
  })();

  if(opts.template) {
    this.template = opts.template;
    return delete this.fn;
  }
};

var Adapter = function (options) {
  setOptions.call(this, options);
  this.helpers = {};
};

Adapter.registerHelper = function (name, helper) {
  if (!name || !helper) {
    return false;
  }
  this.helpers = this.helpers || {};

  return this.helpers[name] = helper;
}

Adapter.registerHelpers = function (helpers) {
  if (!helpers) {
    return false;
  }
  for (var k in helpers) {
    this.registerHelper(k, helpers[k]);
  }

  return this.helpers;
}

Adapter.prototype.registerHelper = function (name, helper) {
  if (!name || !helper) {
    return false;
  }

  return this.helpers[name] = helper;
}

Adapter.prototype.registerHelpers = function (helpers) {
  if (!helpers) {
    return false;
  }
  for (var k in helpers) {
    this.registerHelper(k, helpers[k]);
  }

  return this.helpers;
}

Adapter.prototype.set = function (options) {
  return setOptions.call(this, options);
};

Adapter.prototype.compile = function () {
  if (this.fn) {
    return this.fn;
  }
  
  return this.fn = this.engine.compile(this.template, this.options);
};

Adapter.prototype.render = function (data) {
  var dat = data || {}
    , h = '';

  for (h in Adapter.helpers) {
    dat[h] = Adapter.helpers[h];
  }
  for (h in this.helpers) {
    dat[h] = this.helpers[h];
  }

  // Use the original registerHelper method if it's mustache of handlebars
  if (this.engineName === 'handlebars' || this.engineName === 'mustache') {
    this.engine.registerHelpers(dat);
  }

  this.options['baseName'] = data && data.template && data.template.baseName ? data.template.baseName : '';
  return this.engine.render(data, this.compile());
};

module.exports.Adapter = Adapter;
