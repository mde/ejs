/*
 * Geddy JavaScript Web development framework
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/
var fs = require('fs')
  , errors = require('./errors')
  , response = require('./response');
//var Templater = require('geddy-template/lib/adapters/ejs').Templater

/**
  @name controller
  @namespace controller
*/
var controller = {};

/**
  @name controller.BaseController
  @constructor
*/
controller.BaseController = function () {
  /**
    @name controller.BaseController#request
    @public
    @type http.ServerRequest
    @description The raw http.ServerRequest object for this request/response
    cycle.
   */
  this.request = null;
  /**
    @name controller.BaseController#response
    @public
    @type http.ServerResponse
    @description The raw http.ServerResponse object for this request/response
    cycle.
   */
  this.response = null;
  /**
    @name controller.BaseController#params
    @public
    @type Object
    @description The parsed params for the request. Also passed as an arg
    to the action, added as an instance field for convenience.
   */
  this.params = null;
  /**
    @name controller.BaseController#cookies
    @public
    @type Object
    @description Cookies collection for the request
   */
  this.cookies = null;
  /**
    @name controller.BaseController#name
    @public
    @type String
    @description The name of the controller constructor function,
    in CamelCase with uppercase initial letter.
   */
  this.name = null;
  /**
    @name controller.BaseController#respondsWith
    @public
    @type Array
    @description Content-type the controller can respond with.
    @default ['txt']
   */
  this.respondsWith = ['txt'];
  /**
    @name controller.BaseController#content
    @public
    @type {Object|String}
    @description Content to use for the response.
   */
  this.content = '';
  /**
    @name controller.BaseController#format
    @public
    @type {String}
    @description Determined by what format the client requests, and if the
    controller/action supports it. Built-in formats can be found in the enum
    controller.formats
   */
  this.format = '';
  /**
    @name controller.BaseController#contentType
    @public
    @type {String}
    @description Content-type of the response -- a result of the
    content-negotiation process. Determined by the format, and by what
    content-types the client accepts.
   */
  this.contentType = '';
  /**
    @name controller.BaseController#beforeFilters
    @public
    @type {Array}
    @description Actions to be performed before rendering a repsonse.
   */
  this.beforeFilters = [];
  /**
    @name controller.BaseController#afterFilters
    @public
    @type {Array}
    @description Actions to be performed after rendering a repsonse.
   */
  this.afterFilters = [];

  /*
  // The template root to look in for partials when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.template = undefined;
  // Should the layout be rendered
  this.layout = true;
  // The template layout directory to look in when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.layoutpath = undefined;
  */
};

/**
  @name controller.formats
  @enum
  @description High-level set of options which can represent multiple
  content-types.
 */
controller.formats = {
  /**
    @name controller.formats.TXT
    @constant
    @type {String}
    @description String constant with a value of 'txt'
  */
  TXT: 'txt'
  /**
    @name controller.formats.JSON
    @constant
    @type {String}
    @description String constant with a value of 'json'
  */
, JSON: 'json'
  /**
    @name controller.formats.XML
    @constant
    @type {String}
    @description String constant with a value of 'xml'
  */
, XML: 'xml'
  /**
    @name controller.formats.HTML
    @constant
    @type {String}
    @description String constant with a value of 'html'
  */
, HTML: 'html'
};

/**
  @name controller.formatters
  @static
  @namespace
  @description Contains the static methods for returning data in a specific
  format.
 */
controller.formatters = new (function () {

  /**
    @name controller.formatters.json
    @static
    @function
    @description JSON-formats an object, by looking for toJson/toJSON methds
    defined on it, and then falling back to JSON.stringify.

    @param {Object|String} content The content to be formatted.
   */
  this.json = function (content) {
    var toJson = content.toJson || content.toJSON;
    if (typeof toJson == 'function') {
      return toJson.call(content);
    }
    return JSON.stringify(content);
  };
  /**
    @name controller.formatters.js
    @static
    @function
    @description Formats an object as JSONP, by looking for toJson/toJSON methds
    defined on it, and then falling back to JSON.stringify, and wrapping it in a
    callback.

    @param {Object|String} content The content to be formatted.
    @param {controller.BaseController} [controller] The controller handling the
    response to be formatted.
   */
  this.js = function (content, controller) {
    var params = controller.params;
    if (!params.callback) {
      err = new errors.InternalServerError('JSONP callback not defined.');
      controller.error(err);
    }
    return params.callback + '(' + JSON.stringify(content) + ');';
  };
  /**
    @name controller.formatters.txt
    @static
    @function
    @description Formats an object as plaintext, by looking for a toString
    defined on it, and then falling back to JSON.stringify.

    @param {Object|String} content The content to be formatted.
   */
  this.txt = function (content) {
    if (typeof content.toString == 'function') {
      return content.toString();
    }
    return JSON.stringify(content);
  };

  /**
    @name controller.formatters.html
    @static
    @function
    @description Renders a template with the data-object as its params.

    @param {Object|String} content The content to be formatted.
    @param {controller.BaseController} [controller] The controller handling the
    response to be formatted.
   */
  this.html = function (content, controller) {
    controller.renderTemplate(data);
  };
})();

BaseController.prototype = new (function () {

  // Private methods, utility methods
  // -------------------
  var _addFilter = function (phase, filter, opts) {
        var obj = {name: filter};
        obj.except = opts.except;
        obj.only = opts.only;
        this[phase + 'Filters'].push(obj);
      }

    , _execFilters = function (action, phase, callback) {
        var _this = this;
        var filters = this[phase + 'Filters'];
        var filter;
        var name;
        var hook;
        var list = [];
        var applyFilter;
        for (var i = 0; i < filters.length; i++) {
          filter = filters[i];
          applyFilter = true;
          if (filter.only && filter.only != action) {
            applyFilter = false;
          }
          if (filter.except && filter.except == action) {
            applyFilter = false;
          }
          if (applyFilter) {
            name = filter.name;
            hook = geddy.hooks.collection[name];
            hook.args = [_this];
            list.push(hook);
          }
        }
        var chain = new geddy.async.AsyncChain(list);
        chain.last = callback;
        chain.run();
      }

    , _negotiateContent = function (frmt) {
        var format
          , contentType
          , types = []
          , match
          , params = this.params
          , err
          , accepts = this.request.headers.accept
          , accept
          , pat
          , wildcard = false;

        // If the client provides an Accept header, split on comma
        // Some user-agents may include whitespace with the comma
        if (accepts) {
          accepts = accepts.split(/\s*,\s*/);
        }
        // If the client doesn't provide an Accept header, assume
        // it's happy with anything
        else {
          accepts = ['*/*'];
        }

        if (frmt) {
          types = [frmt];
        }
        else if (params.format) {
          var f = params.format;
          // See if we can actually respond with this format,
          // i.e., that this one is in the list
          if (f && ('|' + this.respondsWith.join('|') + '|').indexOf(
              '|' + f + '|') > -1) {
            types = [f];
          }
        }
        else {
          types = this.respondsWith;
        }

        // Okay, we have some format-types, let's see if anything matches
        if (types.length) {
          for (var i = 0, ii = accepts.length; i < ii; i++) {
            // Ignore quality factors for now
            accept = accepts[i].split(';')[0];
            if (accept == '*/*') {
              wildcard = true;
              break;
            }
          }

          // If agent accepts anything, respond with the controller's first choice
          if (wildcard) {
            var t = types[0];
            format = t;
            contentType = response.formatsPreferred[t];
            if (!contentType) {
              this.throwUndefinedFormatError();
            }
          }
          // Otherwise look through the acceptable formats and see if
          // Geddy knows about any of them.
          else {
            for (var i = 0, ii = types.length; i < ii; i++) {
              pat = response.formatPatterns[types[i]];
              if (pat) {
                for (var j = 0, jj = accepts.length; j < jj; j++) {
                  match = accepts[j].match(pat);
                  if (match) {
                    format = types[i];
                    contentType = match;
                    break;
                  }
                }
              }
              // If respondsWith contains some random format that Geddy doesn't know
              // TODO Make it easy for devs to add new formats
              else {
                this.throwUndefinedFormatError();
              }
              // Don't look at any more formats if there's a match
              if (match) {
                break;
              }
            }
          }
        }
        return {format: format, contentType: contentType};
      };

  // Pseudo-private, non-API
  // -------------------
  /**
   * Primary entry point for calling the action on a controller
   * Wraps the action so befores and afters can be run
   */
  this._handleAction = function (action) {
    var _this = this;
    // Wrap the actual action-handling in a callback to use as the 'last'
    // method in the async chain of before-filters
    var callback = function () {
      _this[action].apply(_this, [_this.request, _this.response, _this.params]);
    };
    _execFilters.apply(this, [action, 'before', callback]);
  };

  // Public methods
  // -------------------
  /**
    @name controller.BaseController#before
    @public
    @function
    @description Adds an action to the beforeFilters list.
    @param {Function} filter Action to add to the beforeFilter list of
    actions to be performed before a response is rendered.
    @param {Object} [opts]
      @param {Array} [opts.except=null] List of actions where the
      before-filter should not be performed.
      @param {Array} [opts.only=null] This list of actions are the
      only actions where this before-filter should be performed.
   */
  this.before = function (filter, options) {
    _addFilter.apply(this, ['before', filter, options || {}]);
  };

  /**
    @name controller.BaseController#after
    @public
    @function
    @description Adds an action to the afterFilters list of actions
    to be performed after a response is rendered.
    @param {Function} filter Action to add to the afterFilter list.
    @param {Object} [opts]
      @param {Array} [opts.except=null] List of actions where the
      after-filter should not be performed.
      @param {Array} [opts.only=null] This list of actions are the
      only actions where this after-filter should be performed.
   */
  this.after = function (filter, options) {
    _addFilter.apply(this, ['after', filter, options || {}]);
  };

  /**
    @name controller.BaseController#redirect
    @public
    @function
    @description Sends a 302 redirect to the client, based on either a
    simple string-URL, or a controller/action/format combination.
    @param {String|Object} target Either an URL, or an object literal containing
    controller/action/format attributes to base the redirect on.
   */
  this.redirect = function (target) {
    var url;
    if (typeof target == 'string') {
      url = target;
    }
    else {
      var contr = target.controller || this.name;
      var act = target.action;
      var ext = target.format || this.params.format;
      var id = target.id;
      contr = geddy.string.decamelize(contr);
      url = '/' + contr;
      url += act ? '/' + act : '';
      url += id ? '/' + id : '';
      if (ext) {
        url += '.' + ext;
      }
    }
    var r = new response.Response(this.response);
    var headers = {'Location': url};
    if (this.cookies) {
      headers['Set-Cookie'] = this.cookies.serialize();
    }
    this.session.close(function () {
      r.send('', 302, headers);
    });
  };

  /**
    @name controller.BaseController#error
    @public
    @function
    @description Respond to a request with an appropriate HTTP error-code.
    If a status-code is set on the error object, uses that as the error's
    status-code. Otherwise, responds with a 500 for the status-code.
    @param {Object} err The error to use as the basis for the response.
   */
  this.error = function (err) {
    errors.respond(this.response, err);
  };

  /**
    @name controller.BaseController#transfer
    @public
    @function
    @description Transfer a request from its original action to a new one. The
    entire request cycle is repeated, including before-filters.
    @param {Object} action The new action designated to handle the request.
   */
  this.transfer = function (action) {
    this.params.action = action;
    this._handleAction(action);
  };

  /**
    @name controller.BaseController#respond
    @public
    @function
    @description Performs content-negotiation, and renders a response.
    @param {Object|String} content The content to use in the response.
    @param {String} [format] The desired format for the response.
   */
  this.respond = function (content, format) {
    var c = content
      , r
      , headers
    // format and contentType are set at the same time
    // format may not be passed
      , negotiated = _negotiateContent.call(this, format);

    this.format = negotiated.format;
    this.contentType = negotiated.contentType;

    if (!this.contentType) {
      var err = new errors.NotAcceptableError('Not an acceptable media type.');
      this.error(err);
    }

    // If content needs formatting
    if (typeof c != 'string') {
      if (this.format) {
        c = controller.formatters[format](data, this);
      }
      // If we couldn't perform content-negotiaton successfully, bail
      // with error
      else {
        this.throwUndefinedFormatError();
        return;
      }
    }

    this.content = c;

    r = new response.Response(this.response);
    headers = {'Content-Type': this.contentType};
    if (this.cookies) {
      headers['Set-Cookie'] = this.cookies.serialize();
    }
    if (this.session) {
      this.session.close(function () {
        r.send(c, 200, headers);
      });
    }
    else {
      r.send(c, 200, headers);
    }
  };

  this.render = this.respond;


  this.throwUndefinedFormatError = function () {
    err = new errors.InternalServerError('Format not defined in response.formats.');
    this.error(err);
  };

 /*
 this.renderTemplate = function (data) {
    var _this = this;

    // Calculate the template if not set
    this.template = this.template ||
    	'app/views/' + geddy.inflections[this.name].filename.plural + '/' + this.params.action;

    if (this.layout) {
	    // Calculate the layout if not set
	    this.layoutpath = this.layoutpath ||
	    	'app/views/layouts/' + geddy.inflections[this.name].filename.plural;
    }

    var templater = new Templater();
    var content = '';

    templater.addListener('data', function (d) {
      // Buffer for now, but could stream
      content += d;
    });

    templater.addListener('end', function () {
      _this.render(content);
    });

    templater.render(data, {
      layout: this.layoutpath
    , template: this.template
    , controller: this.name
    , action: this.params.action
    });
  };
  */

})();

exports.BaseController = controller.BaseController;

