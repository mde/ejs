var TemplatoHandlebars = (function() {

  function TemplatoHandlebars() {
    try {
      this.engine = this.engine || require('handlebars');
    } catch(err) {
      throw "To use Handlebars you will need to install it: [sudo] npm install [-g] handlebars";
    }
  };

  TemplatoHandlebars.prototype.compile = function(template, options) {
    return this.engine.compile(template, options);
  };

  TemplatoHandlebars.prototype.render = function(data, fn) {
    return fn(data);
  };

  // Iterate over a object of helpers and assign them by name
  TemplatoHandlebars.prototype.registerHelper = function(data) {
    var helper;

    for(helper in data) {
      // Only functions are allowed to be assigned
      if(typeof data[helper] === 'function') {
        this.engine.registerHelper(helper, data[helper]);
      }
    }
  };

  return TemplatoHandlebars;

})();

module.exports = TemplatoHandlebars;
