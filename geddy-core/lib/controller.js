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
var fleegix = require('geddy-core/lib/fleegix');
var async = require('geddy-util/lib/async');

var Controller = function (obj) {
//var Controller = function (app, name, params, req, resp) {
  // The http.ServerRequest passed to the 'request' event
  // callback function
  this.request = null;
  // The http.ServerResponse passed to the 'request' event
  // callback function
  this.response = null;
  // The action gets passed these as an argument, but we keep
  // them here too to have access to the file extension, so
  // we can do content-negotiation
  this.params = null;
  
  this.cookies = null;
  // The name of the controller constructor function,
  // in CamelCase with uppercase initial letter
  this.name = null;
  // Content-type the controller can respond with -- assume
  // minimum of plaintext
  this.respondsWith = ['text'];
  // The name, in lowercase_with_underscores, used for
  // picking the template if any to attempt to render
  this.nameDecamelized = null;
  // Content to respond with -- can be an Object or String
  this.content = '';
  // High-level set of options which can represent multiple
  // content-types
  // 'text', 'json', 'xml', 'html'
  this.format = '';
  // Content-type of the response -- driven by the format, and
  // by what content-types the client accepts
  this.contentType = '';

  this.currentPartialId = 0;

  this.baseTemplateNode = null;

  this.beforeFilters = [];

  this.afterFilters = [];

  // Copy all props passed in from the app
  for (var p in obj) {
    this[p] = obj[p];
  }

  this.nameDecamelized = util.string.decamelize(this.name);

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
        hook = hooks.collection[name];
        hook.args = [_this];
        list.push(hook);
      }
    }
    var chain = new async.AsyncChain(list);
    chain.last = callback;
    chain.run();
  };

  
  this.formatters = {
    json: function (content) {
      var toJson = content.toJson || content.toJSON;
      if (typeof toJson == 'function') {
        return toJson.call(content);
      }
      return JSON.stringify(content);
    },
    text: function (content) {
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
      var ext = redir.extension || this.params.extension;
      var id = redir.id;
      contr = util.string.decamelize(contr);
      url = '/' + contr;
      url += act ? '/' + act : '';
      url += id ? '/' + id : '';
      url += '.' + ext;
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
    this.session.close(function () {
      r.send(content, 200, headers);
    });
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
    else if (params.extension) {
      var t = response.contentTypes[params.extension];
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
    var i;
    var pat;
    var wildcard = false;

    // Ignore quality factors for now
    for (i = 0; i < a.length; i++) {
      a[i] = a[i].split(';')[0];
      if (a[i] == '*/*') {
        wildcard = true;
      }
    }
    for (i = 0; i < types.length; i++) {
      pat = response.formatPatterns[types[i]];
      if (pat) { 
        for (var j = 0; j < a.length; j++) {
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
    
    if (!contentType && wildcard) {
      t = types[0];
      format = t;
      match = response.formats[t];
      if (match) {
        contentType = match.split('|')[0];
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

  this.partial = function (partial, params, parentNode) {
    var _this = this;
    var node;
    var partialId = this.currentPartialId;
    var isBaseNode = !this.baseTemplateNode;
    var key;
    var url = isBaseNode ? partial : null;
    
    // Curry the partial method to use the current node as the
    // parent in subsequent calls
    params.partial = function (part, parm) {
      return _this.partial.call(_this, part, parm, node);
    };
   
    if (!url) {
      key = parentNode.dirname + '/' + partial + '.html.ejs';
      if (templateRegistry[key]) {
        url = key;
      }
    }
    if (!url) {
      key = 'app/views/' + partial + '.html.ejs';
      if (templateRegistry[key]) {
        url = key;
      }
    }
    if (!url) {
      var e = new errors.InternalServerError('Template path "' + key + '" not found');
      this.error(e);
      return;
    }

    // Create the current node, with a reference to its parent, if any
    node = new templates.TemplateNode(partialId, url, params, parentNode);
    // If there is a parent, add this node as its child
    if (parentNode) {
      parentNode.childNodes[partialId] = node;
    }
      
    // If this is the base node (i.e., there's no baseTemplateNode yet),
    // give this node the finishRoot method that actually renders the final,
    // completed content for the entire template
    if (isBaseNode) {
      node.finishRoot = function () {
        _this.formatContentAndFinish(_this.baseTemplateNode.content);
      }
      this.baseTemplateNode = node;
      // Kick off the hierarchical async loading process
      node.loadTemplate();
    }
    
    // Increment the current partial id for the next call
    this.currentPartialId++;
    
    // Return the placeholder text to represent this template -- it gets
    // replaced in the callback from the async load of the actual content
    return '###partial###' + partialId;
  };

  this.formatContent = function (format, content) {
    if (format == 'html') {
      var _this = this;
      var name = this.nameDecamelized;
      var act = this.params.action;
      // E.g., app/views/snow_dogs/index.html.ejs
      var path = 'app/views/' + name + '/' + act + '.html.ejs';
      
      this.partial(path, content);
      return;
    }
    else {
      var c = this.formatters[format](content);
      this.formatContentAndFinish(c);
    }
  };

}();

exports.Controller = Controller;

