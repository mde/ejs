var TemplatoGeddyEJS = (function() {

  function TemplatoGeddyEJS() {
    // Hardcoded for specifically Geddy's EJS implementation
    // Location: `lib/template/engines/ejs.js`
    this.engine = this.engine || require('../../../../lib/template/engines/ejs');
  };

  TemplatoGeddyEJS.prototype.compile = function(template, options) {
    return this.engine.compile(template, options);
  };

  TemplatoGeddyEJS.prototype.render = function(data, fn) {
    return fn(data);
  };

  return TemplatoGeddyEJS;

})();

module.exports = TemplatoGeddyEJS;
