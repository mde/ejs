var path = require('path')
  , TemplatoJade;

TemplatoJade = (function() {

  function TemplatoJade() {
    try {
      this.engine = this.engine || require(path.join(process.cwd(), 'node_modules', 'jade'));
    } catch(err) {
      throw "To use Jade you will need to install it: [sudo] npm install [-g] jade";
    }
  };

  TemplatoJade.prototype.compile = function(template, options) {
    return this.engine.compile(template, options);
  };

  TemplatoJade.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoJade;

})();

module.exports = TemplatoJade;
