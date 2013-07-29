/*
* FIXME: Move format-specific stuff out of responder into
*   individual strategies? All the API formats share this
*   strategy for now.
*/
var utils = require('utilities')
  , Strategy = function (content, options, cb) {

      // Where to redirect to on a success event
      var params = this.params
        , type = options.type
          // Check the content for an errors hash
        , isFailure = (content.errors && typeof content.errors === 'object')
        , response;

      // Determine if `content` is a model object
      if (typeof content === 'object' && content.type && content.toObj) {
        // Respond in the style {attr: val, attr2: val...}
        response = content.toObj();
        response.id = content.id;
        response.type = content.type;
        response.errors = content.errors;

        this.outputFormattedContent(response, options);
      }
      // Determine if `content` is a collection of models
      else if (content instanceof Array) {

        response = [];

        for(var i=0, ii=content.length; i<ii; i++) {
          response[i] = content[i].toObj();
          response[i].id = content[i].id;
          response[i].type = content[i].type;
        }

        this.outputFormattedContent(response, options);
      }
      else if (content instanceof Error) {
        // Format error for API-display
        response = {
          statusCode: content.statusCode
        , statusText: content.statusText
        , message: content.message
        , stack: content.stack
        };
        options.statusCode = content.statusCode || 500;
        this.outputFormattedContent(response, options);
      }
      else {
        throw new Error(
          'respondWith expects either a model or collection of models');
      }
    };

module.exports = Strategy;
