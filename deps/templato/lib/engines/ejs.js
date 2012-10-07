var path = require('path')
  , TemplatoEJS;

TemplatoEJS = (function() {

  function TemplatoEJS() {
    try {
      this.engine = this.engine || require(path.join(process.cwd(), 'node_modules', 'ejs'));
    } catch(err) {
      throw "To use EJS you will need to install it: [sudo] npm install [-g] ejs";
    }
  };

  TemplatoEJS.prototype.compile = function(template, options) {
    return this.engine.compile(template, options);
  };

  TemplatoEJS.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoEJS;

})();

module.exports = TemplatoEJS;
