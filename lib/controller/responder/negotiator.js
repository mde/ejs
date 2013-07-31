var errors = require('../../response/errors')
  , response = require('../../response')
  , utils = require('utilities');

var throwUndefinedFormatError = function () {
  var err = new errors.InternalServerError(
    'Format not defined in response.formats.');
  throw err;
};

var Negotiator = function (accepts, acceptable, requested, strategies) {
  this.accepts = accepts;
  this.acceptableFormats = acceptable;
  this.requestedFormat = requested;
  this.availableStrategies = strategies;
};

Negotiator.prototype = new (function () {

  this.negotiate = function (specificFormat) {
    var format
      , contentType
      , types = []
      , accepts = this.accepts
      , wildcard = false
      , match
      , err
      , accept
      , pat
      , i
        // Clone accepted formats
      , acceptFormats = this.acceptableFormats.slice(0)
      , f = this.requestedFormat;

    strategies = this.availableStrategies || {};


    // Copy in additional formats from the user's custom strategies
    for (var key in strategies) {
      if (acceptFormats.indexOf(key) < 0) {
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
    if (specificFormat) {
      types = [specificFormat];
    }
    // Otherwise check the request params
    else if (f) {
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
          throwUndefinedFormatError();
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
            throwUndefinedFormatError();
            return;
          }
        }
      }
    }
    else {
      throwUndefinedFormatError();
      return;
    }

    return {
      format: format
    , contentType: contentType
    };
  };

})();

module.exports.Negotiator = Negotiator;
