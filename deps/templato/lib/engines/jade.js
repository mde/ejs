var TemplatoJade = (function() {

  function TemplatoJade() {
    try {
      this.engine = this.engine || require('jade');
    } catch(err) {
      throw "To use Jade you will need to install it: [sudo] npm install [-g] jade";
    }
  };

  TemplatoJade.prototype.compile = function(template) {
    return this.engine.compile(template);
  };

  TemplatoJade.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoJade;

})();

module.exports = TemplatoJade;
