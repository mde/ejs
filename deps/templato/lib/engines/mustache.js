require('../../color');

var TemplatoHandlebars = (function() {

  function TemplatoHandlebars() {
    try {
      this.engine = this.engine || require('handlebars');
    } catch(err) {
      throw [
          "To use Handlebars you will need to install it: [sudo] npm install [-g] handlebars"
        , ""
        , "Mustache, Handlebars same thing, so we're installing Handlebars. http://is.gd/kYTJyS"
      ].join('\n');
    }
  };

  TemplatoHandlebars.prototype.compile = function(template) {
    return this.engine.compile(template);
  };

  TemplatoHandlebars.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoHandlebars;

})();

module.exports = TemplatoHandlebars;
