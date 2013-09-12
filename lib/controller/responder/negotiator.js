var errors = require('../../response/errors')
  , response = require('../../response')
  , utils = require('utilities');

var Negotiator = function () {};

Negotiator.prototype = new (function () {

  var calculateFormats = function (requestedFormat, supportedFormats) {
        var formats;
        if (requestedFormat) {
          // TODO test var with formats
          // If we can respond with the requested format then assign it to formats
          if (supportedFormats.indexOf(requestedFormat) >= 0) {
            formats = [requestedFormat];
          }
        }
        // Otherwise assign all possible formats
        else {
          formats = supportedFormats;
        }
        return formats;
      }

      calculateFormatAndContentType = function (formats, accepts) {
        var format
          , contentType
          , match;
        // See if any format formats match the accept header
        if (formats && formats.length) {
          // No accepts-header, or agent accepts wildcard
          // Respond with controller's first choice
          if (!accepts || accepts.indexOf('*/*') > -1) {
            format = formats[0];
            contentType = response.getContentTypeForFormat(format);
            // Controllers should at least one format with a valid contentType
          }
          // Otherwise look through supported formats and see if Geddy
          // knows about any of them
          else {
            // Split on comma -- some user-agents include whitespace with the comma
            accepts = accepts.split(/\s*,\s*/);
            for (var i = 0, ii = formats.length; i < ii; i++) {
              match = response.matchAcceptHeaderContentType(accepts, formats[i]);
              if (match) {
                format = formats[i];
                contentType = match;
                break;
              }
            }
          }
        }

        if (!(format && contentType)) {
          return null;
        }

        return {
          format: format
        , contentType: contentType
        }
      };

  this.init = function (accepts, supported, requested) {
    this.clientAccepts = accepts;
    this.supportedFormats = supported;
    this.requestedFormat = requested;
  };

  this.negotiate = function (formatOverride) {
    var formats = []
      , accepts = this.clientAccepts
      , supportedFormats = this.supportedFormats
      , requestedFormat = this.requestedFormat
      , result;

    // Figure out what formats avaliable
    // ===
    // If a format was requested as an argument use it
    if (formatOverride) {
      formats = [formatOverride];
    }
    else {
      formats = calculateFormats(requestedFormat, supportedFormats);
    }

    // Try to calculate a format/contentType that's acceptable to all parties
    // ===
    result = calculateFormatAndContentType(formats, accepts);

    return result;
  };

})();

module.exports.Negotiator = Negotiator;
