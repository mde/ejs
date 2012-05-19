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
  , crypto = require('crypto')
  , errors = require('./errors')
  , response = require('./response')
  , Templater = require('./template/adapters/ejs').Templater

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
    @name controller.BaseController#completed
    @public
    @type {Boolean}
    @description The controller action has already completed, and a response
    has been sent to the client.
   */
  this.completed = false;
  // The template root to look in for partials when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.template = null;
  // The template layout directory to look in when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.layout = null;
  // Time accessed
  this.accessTime = null;
  // Anti-CSRF token for PUT/POST/DELETE
  this.sameOriginToken = null;
  // The list of filters to perform before running the action
  this._beforeFilters = [];
  // The list of filters to perform before finishing the response
  this._afterFilters = [];
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
    @name controller.formats.JS
    @constant
    @type {String}
    @description String constant with a value of 'js'
  */
, JS: 'js'
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
    @name controller.formatters.xml
    @static
    @function
    @description XML-formats an object, by looking for toXml/toXML methds
    defined on it, and then falling back to geddy.XML.stringify.

    @param {Object|String} content The content to be formatted.
   */
  this.xml = function (content) {
    var toXml = content.toXml || content.toXML;
    if (typeof toXml == 'function') {
      return toXml.call(content);
    }
    return geddy.XML.stringify(content);
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

})();

controller.BaseController.prototype = new (function () {

  // Private methods, utility methods
  // -------------------
  var _addFilter = function (phase, filter, opts) {
        var obj = {def: filter};
        obj.except = opts.except;
        obj.only = opts.only;
        obj.async = opts.async;
        this['_' + phase + 'Filters'].push(obj);
      }

    , _execFilters = function (action, phase, callback) {
        var _this = this;
        var filters = this['_' + phase + 'Filters'];
        var filter;
        var list = [];
        var func;
        var applyFilter;
        if (!filters) {
          callback();
          return;
        }
        for (var i = 0; i < filters.length; i++) {
          filter = filters[i];
          applyFilter = true;
          if (filter.only &&
              (filter.only != action || filter.only.indexOf(action) == -1)) {
            applyFilter = false;
          }
          if (filter.except &&
              (filter.except == action || filter.except.indexOf(action) > -1)) {
            applyFilter = false;
          }
          if (applyFilter) {

            // TODO: Wrap filters to prevent further execution when
            // a req/resp cycle is already completed (e.g., with a
            // redirect

            // Create an async wrapper for any sync filters
            if (!filter.async) {
              func = function (callback) {
                filter.def.apply(_this, []);
                callback();
              };
            }
            else {
              func = filter.def
            }
            list.push({
              func: func
            , args: []
            , callback: null
            , context: _this
            });
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
              _throwUndefinedFormatError.call(this);
              return;
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
                _throwUndefinedFormatError.call(this);
                return;
              }
              // Don't look at any more formats if there's a match
              if (match) {
                break;
              }
            }
          }
        }
        else {
          _throwUndefinedFormatError.call(this);
          return;
        }
        return {format: format, contentType: contentType};
      }

    , _doResponse = function (stat, headers, content) {

        // Response-preemption, as in the case of a redirect, should mean
        // it's only possible to respond once
        if (this.completed) {
          return;
        }
        this.completed = true;

        var self = this
          , r = new response.Response(this.response)
          , action = this.action
          , callback = function () {
              // Set status and headers, can be overridden in after-filters
              if (self.cookies) {
                headers['Set-Cookie'] = self.cookies.toArray();
              }
              r.setHeaders(stat, headers);

              // Run after-filters, then finish out the response
              _execFilters.apply(self, [action, 'after', function () {
                if (self.method == 'HEAD') {
                  r.finish();
                }
                else {
                  r.finalize(self.content);
                }
              }]);
            };

        if (this.session) {
          // Save to accessTime into session for expiry and
          // verifying sameOriginToken
          this.session.set('accessTime', this.accessTime);

          this.session.close(callback);
        }
        else {
          callback();
        }
      }

    , _throwUndefinedFormatError = function () {
        err = new errors.InternalServerError(
            'Format not defined in response.formats.');
        this.error(err);
      }

    , _generateSameOriginToken = function (t) {
        var time = t || this.accessTime
          , sha = crypto.createHash('sha1');
        sha.update(geddy.config.secret);
        sha.update(this.session.id);
        sha.update(time.toString());
        return sha.digest('hex');
      }

    , _protectFromForgery = function (complete) {
        var methods = {
              PUT: true
            , POST: true
            , DELETE: true
            }
          , lastAccess = this.session.get('accessTime')
          , params = this.params
          , token = params.same_origin_token || params.sameOriginToken
          , forbidden = false;

        if (methods[this.method]) {
          if (!token) {
            forbidden = true;
          }
          else {
            if (_generateSameOriginToken.call(this, lastAccess) != token) {
              forbidden = true;
            }
          }
        }
        if (forbidden) {
          err = new errors.ForbiddenError(
              'Cross-site request not allowed.');
          this.error(err);
        }
        else {
          complete();
        }
      };

  // Pseudo-private, non-API
  // -------------------
  /**
   * Primary entry point for calling the action on a controller
   * Wraps the action so befores and afters can be run
   */
  this._handleAction = function (action) {
    var self = this;
    // Wrap the actual action-handling in a callback to use as the 'last'
    // method in the async chain of before-filters
    var callback = function () {
      if (!self.completed) {
        self[action].apply(self, [self.request, self.response, self.params]);
      }
    };

    // Generate the anti-CSRF token
    if (geddy.config.secret && this.session) {
      this.sameOriginToken = _generateSameOriginToken.call(this);
    }

    // Running filters asynchronously breaks handlers that depend on
    // setting listeners on the request before the next tick -- only
    // run them if necessary
    if (this._beforeFilters.length) {
      _execFilters.apply(this, [action, 'before', callback]);
    }
    else {
      callback();
    }
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

  this.protectFromForgery = function (options) {
    var opts = options || {};
    if (!geddy.config.secret) {
      geddy.log.error('protectFromForgery requires an app-secret. ' +
          'Run `geddy secret` in your app.');
    }
    if (!geddy.config.sessions) {
      geddy.log.error('protectFromForgery requires sessions.');
    }
    if (typeof opts.async != 'undefined' && !opts.async) {
      geddy.log.error('protectFromForgery requires the async flag set to true.');
    }
    opts.async = true;
    this.before(_protectFromForgery, opts);
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
    else if (typeof this.app.router.url == 'function') {
      if (this.name && !target.controller)
        target.controller = this.name;
      if (this.params.format && !target.format)
        target.format = this.params.format;

      url = this.app.router.url(target);
    }

    if (!url) {
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

    this.content = '';

    _doResponse.apply(this, [302, {'Location': url}]);
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
    this.completed = true;
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
    @param {Object} [opts] Options.
      @param {String} [opts.format] The desired format for the response.
      @param {String} [opts.template] The path (without file extensions)
      to the template to use to render this response.
      @param {String} [opts.layout] The path (without file extensions)
      to the layout to use to render the template for this response.
   */
  this.respond = function (content, opts) {
    var options = opts || {}
      , format = typeof opts == 'string' ? options : options.format
      , negotiated = _negotiateContent.call(this, format);

    // Error during content-negotiation may result in an error response;
    // do not continue
    if (this.completed) {
      return;
    }

    this.format = negotiated.format;
    this.contentType = negotiated.contentType;

    if (!this.contentType) {
      var err = new errors.NotAcceptableError('Not an acceptable media type.');
      this.error(err);
    }

    if (options.template) {
      this.template = options.template;
    }
    if (options.layout) {
      this.layout = 'app/views/' + options.layout;
    }

    // If content needs formatting
    if (typeof content != 'string') {
      if (this.format) {
        // Special-case HTML -- will go out to template-rendering code,
        // and then come back here with content as a string
        if (this.format == 'html') {
          this.renderTemplate(content);
          return;
        }
        // Otherwise format according to ... format
        else {
          content = controller.formatters[this.format](content, this);
        }
      }
      // If we couldn't perform content-negotiaton successfully, bail
      // with error
      else {
        _throwUndefinedFormatError.call(this);
        return;
      }
    }

    this.content = content;
    _doResponse.apply(this, [200, {'Content-Type': this.contentType}]);

  };

  this.render = this.respond;

  this.renderTemplate = function (data) {
    var _this = this
      , dirName;

    dirName = geddy.inflection.pluralize(this.name);
    dirName = geddy.string.snakeize(dirName);

    // Calculate the template if not set
    this.template = this.template ||
    	'app/views/' + dirName + '/' + this.params.action;

    // Calculate the layout if not set
    this.layout = this.layout ||
      'app/views/layouts/' + dirName;

    var templater = new Templater();
    var content = '';

    templater.addListener('data', function (d) {
      // Buffer for now, but could stream
      content += d;
    });

    templater.addListener('end', function () {
      _this.respond(content, 'html');
    });

    templater.render(data, {
      layout: this.layout
    , template: this.template
    , controller: this.name
    , action: this.params.action
    });
  };

})();

exports.BaseController = controller.BaseController;

