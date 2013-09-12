
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
ErrorController.prototype.__doContentNegotiation =
    ErrorController.prototype._doContentNegotiation;
ErrorController.prototype._setTemplateAndLayout =
    ErrorController.prototype.setTemplateAndLayout;
utils.mixin(ErrorController.prototype, new (function () {

  // Override, need to fall back to HTML if no supported format
  this._doContentNegotiation = function () {
    var negotiated = this.__doContentNegotiation.apply(this, arguments);
    // Return an HTML response for anybody who doesn't want something
    // known and specific
    if (!negotiated.format) {
      negotiated = {
        format: 'html'
      , contentType: 'text/html'
      };
    }
    return negotiated;
  };

  // Override, need to figure out the action based on what type of error
  this.respond = function (err, opts) {
    this.params.action = this._getAction(err);
    // Include requested path on 404 message
    if (err.statusCode == 404) {
      err.message = 'Could not find page "' + this.request.url + '"'
    }
    if (parseInt(err.statusCode, 10) > 499) {
      this.response.resp._stack = err.stack || err.message;
    }
    this._respond(err, opts);
  };

  // Override, fall back to errors/default view if no action-specific
  // view found
  this.setTemplateAndLayout = function (opts) {
    var controllerFilename;
    this._setTemplateAndLayout(opts);
    // Errors will fall back to a single default error view
    if (!geddy.templateRegistry[this.template]) {
      this.template = 'app/views/errors/default'
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


