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
var sys = require('sys');
var fs = require('fs');

var errors = require('geddy-core/lib/errors');
var response = require('geddy-core/lib/response');
var templates = require('geddy-core/lib/templates');
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
  this.respondsWith = ['text'];
  // Content to respond with -- can be an Object or String
  this.content = '';
  // High-level set of options which can represent multiple
  // content-types
  // 'text', 'json', 'xml', 'html'
  this.format = '';
  // Content-type of the response -- driven by the format, and
  // by what content-types the client accepts
  this.contentType = '';
  // The template root to look in for partials when rendering templates
  // Gets created programmatically based on controller name -- see renderTemplate
  this.templateRoot = undefined;
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

  this.handleAction = function (action, params) {
    var _this = this;
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
    , js: function (content, params) {
      return params.callback + '(' + JSON.stringify(content) + ');';
    }
    , text: function (content) {
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
    var format;
    var contentType;
    var types;
    var match;
    var params = this.params;
    var err;
    
    if (frmt) {
      types = [frmt];
    }
    else if (params.format) {
      var t = response.contentTypes[params.format];
      var f = response.formatsReverseMap[t];
      if (f && ('|' + this.respondsWith.join('|') + '|').indexOf(
          '|' + f + '|') > -1) {
        types = [f];
      }
      else {
        err = new errors.NotAcceptableError('Not an acceptable media type.');
        this.error(err);
      }
    }
    else {
      types = this.respondsWith;
    }
    
    // Look for a specific match
    var a = this.request.headers.accept.split(',');
    var pat;
    var wildcard = false;

    // Ignore quality factors for now
    for (var i = 0, ii = a.length; i < ii; i++) {
      a[i] = a[i].split(';')[0];
      if (a[i] == '*/*') {
        wildcard = true;
      }
    }
    
    // If agent accepts anything, respond with the controller's first choice
    if (wildcard) {
      t = types[0];
      format = t;
      match = response.formats[t];
      if (match) {
        contentType = match.split('|')[0];
      }
    }
    // Otherwise look through the acceptable formats and see if
    // the controller supports any of them
    else {
      for (var i = 0, ii = types.length; i < ii; i++) {
        pat = response.formatPatterns[types[i]];
        if (pat) { 
          for (var j = 0, jj = a.length; j < jj; j++) {
            match = a[j].match(pat);
            if (match) {
              format = types[i];
              contentType = match;
              break;
            }
          }
        }
        // If respondsWith contains an unknown format
        // TODO: Better error to tell devs how to set up new formats
        else {
          err = new errors.InternalServerError('Unknown format');
          this.error(err);
        }
        // Don't look at any more formats if there's a match
        if (match) {
          break;
        }
      }
    }
    
    if (!(format && contentType)) {
      err = new errors.InternalServerError('Unknown format');
      this.error(err);
    }
    
    return {format: format, contentType: contentType};
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
      var c = this.formatters[format](data, this.params);
      this.formatContentAndFinish(c);
    }
  };

  this.renderTemplate = function (data) {
    var _this = this;

    // Calculate the templateRoot if not set
    this.templateRoot = this.templateRoot ||
        'app/views/' + geddy.inflections[this.name].filename.plural;
    
    var templater = new Templater();
    var content = '';
    
    templater.addListener('data', function (d) {
      // Buffer for now, but could stream
      content += d;
    });
    
    templater.addListener('end', function () {
      _this.formatContentAndFinish(content);
    });
    
    templater.render(data, [this.templateRoot], this.params.action);
  };

}();

exports.Controller = Controller;

