/*
* FIXME: Move format-specific stuff out of responder into
*   individual strategies? All the API formats share this
*   strategy for now.
*/
var utils = require('utilities')
  , getCreateSuccessLocation = function () {
      hostname = (geddy && geddy.config && geddy.config.fullHostname) || '';
      return hostname;
    }
  , strategy = function (content, options) {

      // Where to redirect to on a success event
      var params = this.params
        , type = options.type
          // Check the content for an errors hash
        , isFailure = (content.errors && typeof content.errors === 'object')
        , response;

      if (isFailure) {
        options.statusCode = 400;
      }
      else {
        if (params.action == 'create') {
          options.statusCode = 201;
        }
        else {
          options.statusCode = 200;
        }
      }

      // Determine if `content` is a model object
      if (typeof content === 'object' && content.type && content.toObj) {
        // Respond in the style {attr: val, attr2: val...}
        response = content.toObj();
        response.id = content.id;
        response.type = content.type;
        response.errors = content.errors;
        if (params.action == 'create' && !isFailure) {
          options.headers = options.headers || {};
          utils.mixin(options.headers, {
            'Location': getCreateSuccessLocation() + '/' +
                utils.string.getInflection(content.type, 'filename', 'plural') + '/' +
                content.id
          });
        }
      }
      // Determine if `content` is a collection of models
      else if (content instanceof Array) {
        response = [];

        for(var i=0, ii=content.length; i<ii; i++) {
          response[i] = content[i].toObj();
          response[i].id = content[i].id;
          response[i].type = content[i].type;
        }

      }
      else if (content instanceof Error || (content.message && content.stack)) {
        // Format error for API-display
        response = {
          statusCode: content.statusCode
        , statusText: content.statusText
        , message: content.message
        , stack: content.stack
        };
        options.statusCode = content.statusCode || 500;
      }
      else {
        throw new Error(
          'respondWith expects either a model, a collection of models, or an Error object');
      }
      this.respond(response, options);
    };

module.exports = strategy;
