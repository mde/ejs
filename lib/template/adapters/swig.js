var file = require('utilities').file
  , swig = {}
  , crypto = require('crypto')
  , shasum = crypto.createHash('sha1');;

swig = function () {
  this.engine = this.engine || file.requireLocal('swig');
};

swig.prototype.compile = function (template, options) {
  // If there is no baseNamePath swig will use the template string as a key.  Use a hash as a key instead
  if(!options.baseNamePath){
    shasum.update(template);
    options.baseNamePath = shasum.digest('hex');
  }
  return this.engine.compile(template, {filename: options.baseNamePath});
};

swig.prototype.render = function (data, fn) {
  return fn(data);
};

module.exports = swig;