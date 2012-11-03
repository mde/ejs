
 var errors = require('../response/errors')
  , utils = require('utilities')
  , BaseController = require('./base_controller.js').BaseController
  , ErrorController;

ErrorController = function (err, req, resp) {
  this.err = err;
  this.request = req;
  this.response = resp;
};

ErrorController.prototype = new BaseController();
ErrorController.prototype.constructor = ErrorController;

ErrorController.prototype.respond = function () {
  var err = this.err;
  this._doResponse(err.statusCode, {'Content-Type': 'text/html'},
      err.message);
};

module.exports.ErrorController = ErrorController;


