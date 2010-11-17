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
var util = require('util');
var fs = require('fs');

var errors = require('geddy-core/lib/errors');
var response = require('geddy-core/lib/response');
var Templater = require('geddy-template/lib/adapters/ejs').Templater

var Controller = function (obj) {
  var undefined; // Local copy of undefined value

  // The http.ServerRequest passed to the 'request' event
  // callback function
  this.request = null;
  // The http.ServerResponse passed to the 'request' event
  // callback function
  this.response = null;
  // The action gets passed these as an argument, but we keep
  // them here too to have access to the format for
  // content-negotiation
  this.params = null;
  // Cookies collection, written out in the finish and redirect methods
  this.cookies = null;
  // The name of the controller constructor function,
  // in CamelCase with uppercase initial letter -- use geddy.inflections
  // to get the other casing versions
  this.name = null;
  // Content-type the controller can respond with -- assume
  // minimum of plaintext
  this.respondsWith = ['txt'];
  // Content to respond with -- can be an Object or String
  this.content = '';
  // High-level set of options which can represent multiple
  // content-types
  // 'txt', 'json', 'xml', 'html'
  this.format = '';
  // Content-type of the response -- driven by the format, and
  // by what content-types the client accepts
  this.contentType = '';
  // The template root to look in for partials when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.template = undefined;
  // Should the layout be rendered
  this.layout = true;
  // The template layout directory to look in when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate  
  this.layoutpath = undefined;  
  // This will be used for 'before' actions for plugins
  this.beforeFilters = [];
  // This will be used for 'after' actions for plugins
  this.afterFilters = [];

  // Override defaults with passed-in options
  geddy.util.meta.mixin(this, obj);

};

Controller.prototype = new function () {

  this.before = function (filter, o) {
    this.addFilter('before', filter, o || {});
  };

  this.after = function (filter, o) {
    this.addFilter('after', filter, o || {});
  };

  this.addFilter = function (phase, filter, opts) {
    var obj = {name: filter};
    obj.except = opts.except;
    obj.only = opts.only;
    this[phase + 'Filters'].push(obj);
  }

  /**
   * Primary entry point for calling the action on a controller
   */
  this.handleAction = function (action, params) {
    var _this = this;
    // Wrap the actual action-handling in a callback to use as the 'last'
    // method in the async chain of before-filters
    var callback = function () {
      _this[action].call(_this, params);
    };
    this.execFilters(action, 'before', callback);
  };

  this.execFilters = function (action, phase, callback) {
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
    var chain = new geddy.util.async.AsyncChain(list);
    chain.last = callback;
    chain.run();
  };


  this.formatters = {
    // Right now all we have is JSON and plaintext
    // Fuck XML until somebody enterprisey wants it
    json: function (content) {
      var toJson = content.toJson || content.toJSON;
      if (typeof toJson == 'function') {
        return toJson.call(content);
      }
      return JSON.stringify(content);
    }
    , js: function (content, controller) {
      var params = controller.params;
      if (!params.callback) {
        err = new errors.InternalServerError('JSONP callback not defined.');
        controller.error(err);
      }
      return params.callback + '(' + JSON.stringify(content) + ');';
    }
    , txt: function (content) {
      if (typeof content.toString == 'function') {
        return content.toString();
      }
      return JSON.stringify(content);
    }
  };

  this.redirect = function (redir) {
    var url;
    if (typeof redir == 'string') {
      url = redir;
    }
    else {
      var contr = redir.controller || this.name;
      var act = redir.action;
      var ext = redir.format || this.params.format;
      var id = redir.id;
      contr = geddy.util.string.decamelize(contr);
      url = '/' + contr;
      url += act ? '/' + act : '';
      url += id ? '/' + id : '';
      if (ext) {
        url += '.' + ext;
      }
    }
    var r = new response.Response(this.response);
    var headers = {'Location': url};
    headers['Set-Cookie'] = this.cookies.serialize();
    this.session.close(function () {
      r.send('', 302, headers);
    });
  };

  this.error = function (err) {
    errors.respond(this.response, err);
  };

  this.transfer = function (act) {
    this.params.action = act;
    this[act](this.params);
  };

  this.respond = function (content, format) {
    // format and contentType are set at the same time
    var negotiated = this.negotiateContent(format);
    this.format = negotiated.format;
    this.contentType = negotiated.contentType;

    if (!this.contentType) {
      var err = new errors.NotAcceptableError('Not an acceptable media type.');
      this.error(err);
    }

    this.formatContentAndFinish(content);
  };

  this.finish = function () {
    var r = new response.Response(this.response);
    var headers = {'Content-Type': this.contentType};
    headers['Set-Cookie'] = this.cookies.serialize();
    var content = this.content;
    if (this.session) {
      this.session.close(function () {
        r.send(content, 200, headers);
      });
    }
    else {
      r.send(content, 200, headers);
    }
  };

  this.negotiateContent = function (frmt) {
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

  this.throwUndefinedFormatError = function () {
    err = new errors.InternalServerError('Format not defined in response.formats.');
    this.error(err);
  };

  this.formatContentAndFinish = function (content) {
    if (typeof content == 'string') {
      this.content = content;
      this.finish();
    }
    else {
      if (this.format) {
        this.formatContent(this.format, content);
      }
      else {
        err = new errors.InternalServerError('Unknown format');
        this.error(err);
      }
    }
  };

  this.formatContent = function (format, data) {
    if (format == 'html') {
      this.renderTemplate(data);
    }
    else {
      var c = this.formatters[format](data, this);
      this.formatContentAndFinish(c);
    }
  };

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
      _this.formatContentAndFinish(content);
    });

    templater.render(data, {
      layout: this.layoutpath
    , template: this.template
    , controller: this.name
    , action: this.params.action
    });
  };

}();

exports.Controller = Controller;

