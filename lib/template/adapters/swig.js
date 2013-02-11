var file = require('utilities').file
  , swig = {};

swig = function () {
  this.engine = this.engine || file.requireLocal('swig');
  // Swig caching is not working properly
  // It appears to be caching by filename rather than full path
  this.engine.init({cache: false});
};

swig.prototype.compile = function (template, options) {
  return this.engine.compile(template, {filename: options.baseName});
};

swig.prototype.render = function (data, fn) {
  return fn(data);
};

module.exports = swig;