/**
* A responder determines the best way to respond to a request
* @constructor
* @param {Object} controller - The controller that owns this Responder
*/
var errors = require('../../response/errors')
  , utils = require('utilities')
  , response = require('../../response')
  , Responder
  // Default strategies
  , respondWithStrategies = {
      html: require('./strategies/html')
      // Eventually these should be unique...
    , json: require('./strategies/api')
    , xml: require('./strategies/api')
    , js: require('./strategies/api')
    , txt: require('./strategies/api')
    };


Responder = function () {
};

Responder.prototype = new (function () {

  this.throwUndefinedFormatError = function () {
    var err = new errors.InternalServerError(
      'Format not defined in response.formats.');
    throw err;
  };

  this.redirect = function () {
    // Delegate to the controller
    this.controller.redirect.apply(this.controller, arguments);
  };

  /**
  * Determines if the Responder can service a request
  * @param {String} [frmt] - The format requested e.g. 'json'
  * @param {Object} [strategies] - A hash of user-defined strategies
  * @returns {Object} - A hash with the signature
  *   `{format: String, contentType: String}`
  */
  this.negotiate = function (frmt, strategies) {
    var format
      , contentType
      , types = []
      , accepts = this.controller.request.headers.accept
      , wildcard = false
      , match
      , err
      , accept
      , pat
      , i
        // Clone accepted formats
      , acceptFormats = this.formats.slice(0);

    strategies = strategies || {};

    // Copy in additional formats from the user's custom strategies
    for(var key in strategies) {
      if(acceptFormats.indexOf(key) < 0) {
        acceptFormats.push(key);
      }
    }

    // If client provides an Accept header, split on comma
    // - some user-agents include whitespace with the comma
    if (accepts) {
      accepts = accepts.split(/\s*,\s*/);
    }
    // If no Accept header is found, assume it's happy with anything
    else {
      accepts = ['*/*'];
    }

    // If a format was requested as an argument use it
    if (frmt) {
      types = [frmt];
    }
    // Otherwise check the request params
    else if (this.controller.params.format) {
      var f = this.controller.params.format;
      // TODO test var with formats

      // If we can respond with the requested format then assign it to types
      if (acceptFormats.indexOf(f) >= 0) {
        types = [f];
      }
    }
    // Otherwise assign all possible formats
    else {
      types = acceptFormats;
    }

    // See if any format types match the accept header
    if (types.length) {
      for (var i = 0, ii = accepts.length; i < ii; i++) {
        accept = accepts[i].split(';')[0]; // Ignore quality factors

        if (accept == '*/*') {
          wildcard = true;
          break;
        }
      }

      // If agent accepts anything, respond with controller's first choice
      if (wildcard) {
        var t = types[0];

        format = t;
        contentType = response.getContentTypeForFormat(t);

        // Controllers should at least one format with a valid contentType
        if (!contentType) {
          this.throwUndefinedFormatError();
          return;
        }
      }
      // Otherwise look through acceptable formats and see if Geddy knows about them
      else {
        for (var i = 0, ii = types.length; i < ii; i++) {
          match = response.matchAcceptHeaderContentType(accepts, types[i]);

          if (match) {
            format = types[i];
            contentType = match;
            break;
          }
          else {
            // Geddy doesn't know about this format
            this.throwUndefinedFormatError();
            return;
          }
        }
      }
    }
    else {
      this.throwUndefinedFormatError();
      return;
    }

    return {
      format: format
    , contentType: contentType
    };
  };

  /**
  * Responds with a model or collection
  * @param {Object} content - The model, collection, or hash of values
  * @param {Object} [options] Options.
  *   @param {String|Object} [options.status] The desired flash message,
  *     can be a string or an errors hash
  *   @param {Boolean} [options.silent] Disables flash messages if set to true
  * @param {Function} [cb] - An optional callback where the first argument
  *   is the response buffer
  */
  this.respond = function (controller, content, opts) {
    opts = opts || {};
    opts.strategies = opts.strategies || respondWithStrategies;

    var negotiated
      , type
      , strategies;

    // Convenient aliases for stuff we need in the controller
    // Everything here needs to be in the controller shim
    // for testing purposes
    this.controller = controller;
    this.params = controller.params;
    this.flash = controller.flash;
    this.headers = controller.request.headers;
    // Backward compat
    this.formats = controller.respondsWith || controller.formats;
    this.doResponse = controller._doResponse;

    // Determine the type of model from the content
    if (content) {
      if (Array.isArray(content)) {
        if (content.length) {
          type = content[0].type.toLowerCase()
        }
        else {
          // No way to determine from empty array
          type = null;
        }
      }
      else if (content.type) {
        type = content.type.toLowerCase()
      }
    }

    // If the user supplied a type use it
    if(opts.type) {
      type = opts.type;
    }

    // Supply this 'type' as an option so the strategies can use it
    opts.type = type;

    strategies = opts.strategies || {};

    negotiated = this.negotiate(opts.format || null, strategies);
    opts = utils.mixin({}, opts, negotiated);

    // Error during content negotiation may result in an error response, so
    // - don't continue
    if (this.controller.completed) {
      return;
    }

    // Was the negotiated type a user-defined strategy?
    if(typeof strategies[negotiated.format] === 'function') {
      strategies[negotiated.format].call(this, content, opts);
    }
    else {
      // The default action is just to output the content in the right format
      this.outputFormattedContent(content, opts);
    }
  };

  /**
  * Lower level respond function that expects stuff like
  * content-negotiation to have been done by a strategy.
  * @param {Object} content - The model, collection, or hash of values
  * @param {Object} options - The required options hash
  *   @param {String} options.format - The negotiated format e.g. "json"
  *   @param {String} options.contentType - The negotiated content type
  *     e.g. "text/plain"
  *   @param {Function} [cb] - An optional callback where the first argument
  *     is the response buffer
  */
  this.outputFormattedContent = function (content, options) {
    var self = this
      , opts = options || {}
      , cb = function (formattedContent) {
          // Delegate to the controller's _doResponse
          self.controller._doResponse(opts.statusCode || 200,
              {'Content-Type': opts.contentType}, formattedContent, cb);
        };

    // Hand content off to formatting along with callback for writing out
    // the formatted respnse
    response.formatContent(opts.format, content, this.controller, opts, cb);
  };
});


module.exports = Responder;
