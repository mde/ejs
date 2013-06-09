var Layout
  , Partial = require('./partial').Partial;

// Subclass of Partial
Layout = function (layoutPath, templatePath, data) {
  var self = this;
  // Call the ctor on 'this' -- the the layoutPath will be our
  // templatePath
  Partial.call(this, layoutPath, data, null);

  // `render` is just a special case of `partial` using the template-path
  // that the layout wraps -- just hard-code the path and pass along
  // the same data
  this.data.render = function () {
    return self.data.partial(templatePath, data);
  };

  this.data.yield = this.data.render;
};

Layout.prototype = Object.create(Partial.prototype);
Layout.prototype.constructor = Layout;

exports.Layout = Layout;
