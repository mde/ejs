 var BaseController = require('./base_controller.js').BaseController
  , StaticFileController;

StaticFileController = function (req, resp, params) {
  this.request = req;
  this.response = resp;
  this.params = params;
};

StaticFileController.prototype = new BaseController();
StaticFileController.prototype.constructor = StaticFileController;

StaticFileController.prototype.respond = function (opts) {
  this.response.sendFile(opts.path);
};

module.exports.StaticFileController = StaticFileController;



