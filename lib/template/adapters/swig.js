var file = require('utilities').file
  , swig = {};

swig = function () {
  this.engine = this.engine || file.requireLocal('swig');
};

swig.prototype.compile = function (template, options) {
  return this.engine.compile(template, {filename: options.baseNamePath});
};

swig.prototype.render = function (data, fn) {
  return fn(data);
};

module.exports = swig;