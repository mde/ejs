var TemplatoEJS
  , TemplatoGeddyEJS
  , TemplatoJade
  , TemplatoMustache
  , TemplatoHandlebars
  , Templato;

Templato = (function() {

  Templato.registerHelper = function(name, helper) {
    if(!this.helpers) this.helpers = {};

    return this.helpers[name] = helper;
  };

  Templato.detectEngine = function(ext) {
    switch(ext) {
      case 'ejs':
        return 'ejs';
      case 'jade':
        return 'jade';
      case 'mu':
      case 'ms':
      case 'mustache':
        return 'mustache';
      case 'hbs':
      case 'handlebars':
        return 'handlebars'
    }
  };

  function Templato() { this.helpers = {}; };

  Templato.prototype.set = function(opts) {
    opts = opts || {};
    this.options = opts.options || {};

    this.engine = (function() {
      switch(opts.engine) {
        case 'ejs':
          TemplatoEJS = require('./engines/ejs')
          return new TemplatoEJS;
        case 'geddy_ejs':
          TemplatoGeddyEJS = require('./engines/geddy_ejs')
          return new TemplatoGeddyEJS;
        case 'jade':
          TemplatoJade = require('./engines/jade')
          return new TemplatoJade;
        case 'mu':
        case 'ms':
        case 'mustache':
          TemplatoMustache = require('./engines/mustache')
          return new TemplatoMustache;
        case 'hbs':
        case 'handlebars':
          TemplatoHandlebars = require('./engines/handlebars')
          return new TemplatoHandlebars;
      }
    })();

    if(opts.template) {
      this.template = opts.template;
      return delete this.fn;
    }
  };

  Templato.prototype.registerHelper = function(name, helper) {
    return this.helpers[name] = helper;
  };

  Templato.prototype.compile = function() {
    if(this.fn) return this.fn;

    return this.fn = this.engine.compile(this.template, this.options);
  };

  Templato.prototype.render = function(data) {
    var helper;

    data = data || {};

    for(helper in this.helpers) {
      data[helper] = this.helpers[helper];
    }
    for(helper in Templato.helpers) {
      data[helper] = Templato.helpers[helper];
    }

    return this.engine.render(data, this.compile());
  };

  return Templato;

})();

module.exports = Templato;
