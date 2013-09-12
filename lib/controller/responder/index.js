/**
* A responder determines the best way to respond to a request
* @constructor
* @param {Object} controller - The controller that owns this Responder
*/
var errors = require('../../response/errors')
  , utils = require('utilities')
  , response = require('../../response')
  , responder = {}
  , strategies = {}
  , htmlStrategy = require('./strategies/html')
  , apiStrategy = require('./strategies/api');

// Include specific strategies for html, json, xml formats
// NOTE: js format (i.e., 'jsonp') only handles GET requests,
// so it can be handled by the default of controller.respond
responder.strategies = {
  html: htmlStrategy
, json: apiStrategy
, xml: apiStrategy
};

responder.Responder = function () {
  this.strategies = utils.mixin({}, responder.strategies);
};

responder.Responder.prototype = new (function () {

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
  this.respond = function (controller, content, options) {
    var opts = options || {}
      , strategies = opts.strategies || this.strategies ||
            utils.mixin({}, responder.strategies);

    // Was the negotiated type a user-defined strategy?
    if (typeof strategies[opts.format] === 'function') {
      // Invoke the strategy on the controller instance
      strategies[opts.format].call(controller, content, opts);
    }
    else {
      // The default action is just to output the content in the right format
      controller.respond(content, opts);
    }
  };

});

// Also export the ctor on the geddy global if it's there
// so end-user devs can subclass it easily
if (typeof geddy != 'undefined') {
  geddy.responder = responder;
}

module.exports = responder;
