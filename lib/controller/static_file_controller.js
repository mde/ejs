 var BaseController = require('./base_controller.js').BaseController
  , StaticFileController;

StaticFileController = function (path, req, resp) {
  this.path = path;
  this.request = req;
  this.response = resp;
};

StaticFileController.prototype = new BaseController();
StaticFileController.prototype.constructor = StaticFileController;

StaticFileController.prototype.respond = function () {
  this.response.sendFile(this.path);
};

module.exports.StaticFileController = StaticFileController;



