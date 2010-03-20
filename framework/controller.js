var Response = require('./response').Response;

var Controller = function (req, resp) {
  this.contentType = 'text/html'
  this.request = req;
  this.response = resp;
  this.content = '';
};

Controller.prototype = new function () {
  this.render = function (content) {
    if (typeof content != 'undefined') {
      this.content = content;
    }
    var r = new Response(this.response);
    r.send(this.content, this.contentType);
  };
}();

exports.Controller = Controller;

