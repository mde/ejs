var TemplatoEJS = (function() {

  function TemplatoEJS() {
    try {
      this.engine = this.engine || require('ejs');
    } catch(err) {
      throw "To use EJS you will need to install it: [sudo] npm install [-g] ejs";
    }
  };

  TemplatoEJS.prototype.compile = function(template) {
    return this.engine.compile(template);
  };

  TemplatoEJS.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoEJS;

})();

module.exports = TemplatoEJS;
