var file = require('utilities').file
  , swig = {};

swig = function () {
  this.engine = this.engine || file.requireLocal('swig');
};

swig.prototype.compile = function (template, options) {
  console.log('compiling swig');
  console.log(options);
  // return this.engine.compile(template, options);
  return this.engine.compile(template, {filename: 'index'});
};

swig.prototype.render = function (data, fn) {
  // console.log(data);
  return fn(data);
};

module.exports = swig;