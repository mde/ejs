
var url = require('url')
  , utils = require('utilities')
  , errors = require('../response/errors')
  , BaseController = require('./base_controller.js').BaseController
  , ErrorController;

ErrorController = function (req, resp) {
  this.request = req;
  this.response = resp;
  this.params = {
      format: this._getFormat(req)
  };
  this.name = 'Error';
  // Stub out flash for templates
  // TODO: Figure out integration with real session and flash
  this.flash = {messages: {}};
  this.canRespondTo(['html', 'json', 'xml', 'txt']);
};

ErrorController.prototype = new BaseController();
ErrorController.prototype.constructor = ErrorController;

ErrorController.prototype._respond = ErrorController.prototype.respond;
ErrorController.prototype._setTemplateAndLayout =
    ErrorController.prototype.setTemplateAndLayout;
utils.mixin(ErrorController.prototype, new (function () {

  this.respond = function (err, opts) {
    this.params.action = this._getAction(err);
    // Include requested path on 404 message
    if (err.statusCode == 404) {
      err.message = 'Could not find page "' + this.request.url + '"'
    }
    this._respond(err, opts);
  };

  this.setTemplateAndLayout = function (opts) {
    var controllerFilename;
    this._setTemplateAndLayout(opts);
    // Errors will fall back to a single default error view
    if (!geddy.templateRegistry[this.template]) {
      controllerFilename = utils.string.getInflection(this.name, 'filename', 'plural')
      this.template = 'app/views/' + controllerFilename + '/default'
    }
  };

  // Set an action based on the error-type
  this._getAction = function (err) {
    var action;

    if (err.statusText) {
      // e.g., Not Found => NotFound
      action = err.statusText.replace(/ /g, '');
      // e.g., NotFound => notFound
      action = utils.string.getInflection(action, 'property', 'singular');
    }
    else {
      action = 'internalServerError';
    }
    return action;
  };

  this._getFormat = function (req) {
    // FIXME: WTF require
    var format = require('../response/format');

    var path = url.parse(req.url).pathname
      , match = path.match(/\.([^.]+)$/)
      , ext = (match && match.length && match[1]) || null
      , format = format.formats[ext] ? ext : geddy.config.defaultErrorFormat;
    return format;
  };

})());

module.exports.ErrorController = ErrorController;


