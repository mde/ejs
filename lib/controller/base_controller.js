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
var crypto = require('crypto')
  , utils = require('utilities')
  , errors = require('../response/errors')
  , response = require('../response')
  , Templater = require('../template').Templater;

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

controller.BaseController.prototype = new (function () {
  var _addFilter
    , _execFilters
    , _negotiateContent
    , _throwUndefinedFormatError
    , _generateSameOriginToken
    , _protectFromForgery;

  /*
   *
   * Private utility methods
   *
  */
  _addFilter = function (phase, filter, opts) {
    var obj = {def: filter};

    obj.except = opts.except;
    obj.only = opts.only;
    obj.async = opts.async;

    this['_' + phase + 'Filters'].push(obj);
  };

  _execFilters = function (action, phase, callback) {
    var self = this
      , connectCompat = geddy.config.connectCompatibility
      , filters = this['_' + phase + 'Filters']
      , list = []
      , applyFilter = true // Default
      , filter
      , func
      , asyncArgs
        createAsyncWrappedFilter = function (def) {
          return function () {
            var args = Array.prototype.slice.call(arguments)
            // Pull off the continuation and run it separately
              , next = args.pop();
            def.apply(self, args);
            next();
          };
        };

    if (!filters) {
      callback();
    }

    // Execute the filters in the order they're defined
    for (var i = 0, ii = filters.length; i < ii; i++) {
      filter = filters[i];

      // See if the filter should run or not
      // NOTE: 'except' runs second, so it will win in the case where
      // an action is in both 'only' and 'except'
      applyFilter = true;
      if (filter.only) {
        if (typeof filter.only === 'string' && action !== filter.only) {
          applyFilter = false;
        }
        if (filter.only instanceof Array && filter.only.indexOf(action) === -1) {
          applyFilter = false;
        }
      }
      if (filter.except) {
        if (typeof filter.except === 'string' && action === filter.except) {
          applyFilter = false;
        }
        if (filter.except instanceof Array && filter.except.indexOf(action) > -1) {
          applyFilter = false;
        }
      }

      if (applyFilter) {
        // TODO: Wrap filters to prevent further execution when
        // a req/resp cycle is already completed (e.g., with a
        // redirect

        // Create an async wrapper for sync filters
        // Connect middleware is async by definition
        asyncArgs = connectCompat ?
            [this.request, this.response] : [];
        if (!filter.async) {
          func = createAsyncWrappedFilter(filter.def);
        }
        else {
          func = filter.def;
        }

        list.push({
            func: func
          , args: asyncArgs
          , callback: null
          , context: this
        });
      }
    }
    var chain = new utils.async.AsyncChain(list);

    chain.last = callback;
    chain.run();
  };

  _negotiateContent = function (frmt) {
    var format
      , contentType
      , types = []
      , params = this.params
      , accepts = this.request.headers.accept
      , wildcard = false
      , match
      , err
      , accept
      , pat
      , i;

    // If client provides an Accept header, split on comma
    // - some user-agents include whitespace with the comma
    if (accepts) {
      accepts = accepts.split(/\s*,\s*/);
    }
    // If no Accept header is found, assume it's happy with anything
    else {
      accepts = ['*/*'];
    }

    if (frmt) {
      types = [frmt];
    }
    else if (params.format) {
      var f = params.format;
      // TODO test var with formats

      // If we can respond with the requested format then assign it to types
      if (('|' + this.respondsWith.join('|') + '|').indexOf('|' + f + '|') > -1) {
        types = [f];
      }
    }
    else {
      types = this.respondsWith;
    }

    // See if any format types match
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
          _throwUndefinedFormatError.call(this);
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
            _throwUndefinedFormatError.call(this);
            return;
          }
        }
      }
    }
    else {
      _throwUndefinedFormatError.call(this);
      return;
    }

    return {
      format: format
    , contentType: contentType
    };
  };

  _throwUndefinedFormatError = function () {
    err = new errors.InternalServerError(
      'Format not defined in response.formats.');
    this.error(err);
  };

  _generateSameOriginToken = function () {
    var sha = crypto.createHash('sha1');

    sha.update(geddy.config.secret);
    sha.update(this.session.id);

    return sha.digest('hex');
  };

  _protectFromForgery = function (complete) {
    var methods = {PUT: true, POST: true, DELETE: true}
      , params = this.params
      , token = params.same_origin_token || params.sameOriginToken
      , forbidden = false;

    if (methods[this.method]) {
      if (!token) {
        forbidden = true;
      }
      else {
        if (_generateSameOriginToken.call(this) != token) {
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

  /*
   *
   * Pseudo-private, non-API
   *
  */
  // Primary entry point for calling the action on a controller
  // Wraps the action so before and after filters can be run
  this._handleAction = function (action) {
    var self = this
      , callback;

    // Wrap the actual action handling in a callback to use as the last
    // - method in the async chain of before filters
    callback = function () {
      if (!self.completed) {
        self[action].apply(self, [self.request, self.response, self.params]);
      }
    };

    // Generate an anti-CSRF token
    if (geddy.config.secret && this.session) {
      this.sameOriginToken = _generateSameOriginToken.call(this);
    }

    if (this._beforeFilters.length) {
      _execFilters.apply(this, [action, 'before', callback]);
    }
    else {
      callback();
    }
  };

  this._doResponse = function (stat, headers, content) {
    // No repeatsies
    if (this.completed) {
      return;
    }

    this.completed = true;

    var self = this
      , r = this.response
      , action = this.params.action
      , callback;

    callback = function () {
      // Set status and headers, can be overridded with after filters
      if (self.cookies) {
        headers['Set-Cookie'] = self.cookies.toArray();
      }
      r.setHeaders(stat, headers);

      // Run after filters, then finish out the response
      _execFilters.apply(self, [action, 'after', function () {
        if (self.method == 'HEAD') {
          r.finish();
        }
        else {
          r.finalize(content);
        }
      }]);
    };

    if (this.session) {
      // Save access time into session for expiry and
      // - verifying sameOriginToken
      this.session.set('accessTime', this.accessTime);
      this.session.close(callback);
    }
    else {
      callback();
    }
  };

  /*
   *
   * Public methods
   *
  */

  /*
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
      only actions where this before-filter should be performed
  */
  this.before = function (filter, options) {
    var opts = options || {};
    _addFilter.apply(this, ['before', filter, opts]);
  };

  /*
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
    var opts = options || {};
    _addFilter.apply(this, ['after', filter, opts]);
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
    // Add a before filter
    this.before(_protectFromForgery, opts);
  };

  this.redirect = function (target, options) {
    /*
      @name controller.BaseController#redirect
      @public
      @function
      @description Sends a 302 redirect to the client, based on either a
        simple string-URL, or a controller/action/format combination.
      @param {String|Object} target Either an URL, or an object literal containing
        controller/action/format attributes to base the redirect on.
      @param {Object} [options] Options.
        @param {Number} [options.statusCode] The HTTP status-code to use for the
          redirect.
    */
    var url
      , opts = options || {}
      , statusCode = opts.statusCode || 302;

    // Make sure it's a 3xx
    if (String(statusCode).indexOf('3') != 0) {
      throw new Error('Redirect status must be 3xx');
    }

    if (typeof target == 'string') {
      url = target
    }
    else if (typeof this.app.router.url == 'function') {
      if (this.name && !target.controller) {
        target.controller = this.name;
      }
      if (this.params.format && !target.format) {
        target.format = this.params.format;
      }
      url = this.app.router.url(target);
    }

    if (!url) {
      var contr = target.controller || this.name
        , act = target.action
        , ext = target.format || this.params.format
        , id = target.id;

      contr = utils.string.decamelize(contr);
      url = '/' + contr;
      url += act ? '/' + act : '';
      url += id ? '/' + id : '';
      if (ext) {
        url += '.' + ext;
      }
    }

    this._doResponse(statusCode, { 'Location': url }, '');
  };

  this.error = function (err) {
    /*
      @name controller.BaseController#error
      @public
      @function
      @description Respond to a request with an appropriate HTTP error-code.
        If a status-code is set on the error object, uses that as the error's
        status-code. Otherwise, responds with a 500 for the status-code.
      @param {Object} err The error to use as the basis for the response. (May
        have an optional statusCode property added.)
    */
    this.completed = true;
    errors.respond(err, this.response);
  };

  this.transfer = function (action) {
    /*
      @name controller.BaseController#transfer
      @public
      @function
      @description Transfer a request from its original action to a new one. The
        entire request cycle is repeated, including before-filters.
      @param {Object} action The new action designated to handle the request.
    */
    this.params.action = action;
    this._handleAction(action);
  };

  /*
    @name controller.BaseController#respond
    @public
    @function
    @description Performs content-negotiation, and renders a response.
    @param {Object|String} content The content to use in the response.
    @param {Object} [options] Options.
      @param {String} [options.format] The desired format for the response.
      @param {String} [options.template] The path (without file extensions)
        to the template to use to render this response.
      @param {String} [options.layout] The path (without file extensions)
        to the layout to use to render the template for this response.
      @param {Number} [options.statusCode] The HTTP status-code to use
        for the response.
  */
  this.respond = function (content, options) {
    var self = this
      , opts = options || {}
      , formatParam = typeof opts == 'string' ? opts : opts.format
      , negotiated = _negotiateContent.call(this, formatParam)
      , format
      , contentType
      , callback;

    callback = function (formattedContent) {
      self._doResponse(opts.statusCode || 200,
          {'Content-Type': contentType}, formattedContent);
    };

    // Error during content negotiation may result in an error response, so
    // - don't continue
    if (this.completed) {
      return;
    }

    format = negotiated.format;
    contentType = negotiated.contentType;

    // If no content type could be found we can't use it
    if (!contentType) {
      var err = new errors.NotAcceptableError('Not an acceptable media type.');
      this.error(err);
      return;
    }

    if (!format) {
      _throwUndefinedFormatError.call(this);
      return;
    }

    // Hand content off to formatting along with callback for writing out
    // the formatted respnse
    response.formatContent(format, content, this, opts, callback);
  };

  this.renderTemplate = function (d, opts, callback) {
    var self = this
      , data = utils.mixin({}, d) // Prevent mixin-polution
      , templater
      , content = '';

    this.setTemplateAndLayout(opts);

    // Mix in controller instance-vars (props only, no methods)
    // Don't overwrite existing same-name properties
    for (var p in this) {
      if (!(data[p] || typeof this[p] == 'function')) {
        data[p] = this[p];
      }
    };

    templater = new Templater(this.layout, this.template, data);
    templater.render(callback);
  };

  this.setTemplateAndLayout = function (opts) {
      var controllerFilename =
              utils.string.getInflection(this.name, 'filename', 'plural')
        , actionFilename = utils.string.snakeize(this.params.action);

    // Set template and layout paths
    if (opts.template) {
      // If template includes full views path just use it
      if (opts.template.match('app/views/')) {
        this.template = opts.template;
      }
      else if (opts.template.match('/')) {
        // If it includes a '/' and it isn't the full path
        // Assume they are using the `controller/action` style
        // and prepend views dir
        this.template = 'app/views/' + opts.template;
      }
      // Assume they only included the action, so add the controller path
      else {
        this.template = 'app/views/' + controllerFilename + '/' + opts.template;
      }
    }
    else {
      this.template = 'app/views/' + controllerFilename + '/' + actionFilename;
    }

    if (opts.layout) {
      // If layout includes `app/views` just return it
      if (opts.layout.match('app/views')) {
        this.layout = opts.layout;
      }
      // If it includes a '/' and it isn't the full path
      // Assume they are using the `controller/action` style
      // and prepend views dir
      else if (opts.layout.match('/')) {
        this.layout = 'app/views/' + opts.layout;
      }
      // Assume they only included the controller, so append it to
      // the layouts path
      else {
        this.layout = 'app/views/layouts/' + opts.layout;
      }
    }
    else {
      // If options.layout is explicitly set to false, use custom
      // Geddy empty template in `lib/template/templates`
      if (opts.layout === false) {
        this.layout = 'geddy/empty';
      }
      else {
        this.layout = 'app/views/layouts/' + controllerFilename;
      }
    }

  };

})();

exports.BaseController = controller.BaseController;

