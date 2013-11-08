/*
* The HTML strategy is more involved than the API ones
* because
*/
var utils = require('utilities')
  , strategy = function (content, options) {

      // Where to redirect to on a success event
      var params = this.params
        , type
          // Check the content for an errors hash
        , isFailure = (content.errors && typeof content.errors === 'object')
        , response
        , controllerName = this.name ?
            utils.string.getInflection(this.name, 'filename', 'plural') : null
        , redirect

          // Default routes to redirect to
        , successRedirects = {
            create: {id: content.id}
          , update: {id: content.id}
          , remove: {}
          }
        , failureRedirects = {
            create: {controller: controllerName, action: 'add'}
          , update: {controller: controllerName, action:'edit', id: content.id}
          , remove: {controller: controllerName, action:'edit', id: content.id}
          }

          /**
          * Select the appropriate redirect URL for the current situation
          * @return {Boolean|Object} - false if no redirect
          *   should occur, a route object if otherwise
          */
        , getRedirect = function () {
            var location = options.location
                // Select the appropriate defaults for the situation
              , redirects = isFailure ? failureRedirects : successRedirects;

            // Don't redirect if the user explicitly set location to false
            if(location === false) {
              return false;
            }
            else {
              // If the user defined a location, use that
              if(location) {
                return location;
              }
              else {
                // Otherwise look it up in the defaults
                return redirects[params.action] || false;
              }
            }
          }

          /**
          * Sets the appropriate flash message for the current situation
          */
        , doFlash = function () {
            var status
                // Default status messages
              , successStatuses = {
                  create: type + ' created'
                , update: type + ' updated'
                , remove: type + ' removed'
                };

            // User can suppress flashes with {silent: true}
            if(options.silent) {
              return;
            }

            // Find an appropriate flash message
            if(options.status) {
              // Use a user provided status if possible

              this.flash.set(isFailure ? 'error' : 'success', options.status);
            }
            else {

              if(isFailure) {
                this.flash.set('error', content.errors);
              }
              else {
                status = successStatuses[params.action.toLowerCase()];

                // Don't set a flash if no message was found
                if(status) {
                  this.flash.set('success', status);
                }
              }
            }
          };

      // Determine if `content` is a model object
      if (typeof content === 'object' && content.type && content.toObj) {

        type = utils.string.getInflection(content.type, 'property', 'singular');

        // Set the flash message
        doFlash.apply(this);

        // Determine if we need to redirect
        redirect = getRedirect.apply(this);

        if (redirect) {
          if (isFailure) {
            this.transfer(redirect.action);
          }
          else {
            this.redirect(redirect);
          }
        }
        else {
          // Respond in the style
          // {model: {attr: val, attr2: val...}, params: {}}
          response = {params: params};
          response[type] = content.toObj();
          response[type].id = content.id;

          this.respond.call(this, response, options);
        }
      }
      // Determine if `content` is a collection of models
      else if (content instanceof Array) {

        if (content.length) {
          type = content[0].type;
        }
        // If collection is empty, look for something in the options
        // to tell us what this is
        else {
          type = options.type;
        }

        if (!type) {
          throw new Error(
            'Cannot determine model type from empty array, specify one in opts');
        }

        type = utils.string.getInflection(type, 'property', 'plural');

        response = {params: params};
        response[type] = [];

        for(var i=0, ii=content.length; i<ii; i++) {
          response[type][i] = content[i].toObj();
          response[type][i].id = content[i].id;
        }

        this.respond(response, options);
      }
      else if (content instanceof Error) {
        // Format error for template-rendering
        response = utils.mixin({}, content);
        response.message = content.message || '';
        if (geddy.config.detailedErrors) {
          // 'message' and 'stack' are not enumerable
          response.stack = content.stack || '';
        }
        else {
          response.stack = '';
        }
        options.statusCode = content.statusCode || 500;
        this.respond(response, options);
      }
      else {
        throw new Error(
          'respondWith expects either a model, a collection of models, or an Error object');
      }
    };

module.exports = strategy;
