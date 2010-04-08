var sys = require('sys');
var fs = require('fs');

var async = require('geddy/lib/async');
var errors = require('geddy/lib/errors');
var response = require('geddy/lib/response');
var templates = require('geddy/lib/templates');
var fleegix = require('geddy/lib/fleegix');
var async = require('geddy/lib/async');

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
  this.nameDeCamelized = null;
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

  this.before = [];

  this.after = [];

  // Copy all props passed in from the app
  for (var p in obj) {
    this[p] = obj[p];
  }

  this.nameDeCamelized = fleegix.string.deCamelize(this.name);

};

Controller.prototype = new function () {
  
  this.handleAction = function (action, params) {
    var _this = this;
    /*
    hooks.collection.requireAuth.func(controller, function (isAuthed) {
      if (isAuthed) {
        controller[route.action](params);
      }
      else {
        var e = new errors.UnauthorizedError('Authentication required.');
        var r = new response.Response(resp);
        r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
      };
    });
    */
    var before = this.before;
    var key;
    var hook;
    var list = [];
    for (var i = 0; i < before.length; i++) {
      key = before[i];
      hook = hooks.collection[key];
      list.push({
        func: hook.func,
        args: [_this],
        callback: hook.callback
      });
    }
    var chain = new async.AsyncChain(list);
    chain.last = function () {
      _this[action].call(_this, params);
    }
    chain.run();
  };
  
  this.formatters = {
    json: function (content) {
      return JSON.stringify(content);
    },
    text: function (content) {
      return JSON.stringify(content);
    }
  };

  this.execHook = function (phase, callback) {
    var names = this[phase];
    var list;
    for (var i = 0; i < names.length; i++) {
      list.push(null);
    }
    var chain = new async.AsyncChain(list);
    chain.last = callback;
    chain.run();
  };
  
  this.respond = function (content, format) {
    // format and contentType are set at the same time
    var negotiated = this.negotiateContent(format);
    this.format = negotiated.format;
    this.contentType = negotiated.contentType;

    if (!this.contentType) {
      throw new errors.NotAcceptableError('Not an acceptable media type.');
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
        throw new errors.NotAcceptableError('Not an acceptable media type.');
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
        throw new errors.InternalServerError('Unknown format');
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
      throw new errors.InternalServerError('Unknown format');
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
        throw new errors.InternalServerError('Unknown format');
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
      var r = new response.Response(this.response);
      r.send(e.message, e.statusCode, {'Content-Type': 'text/html'});
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
      var name = this.nameDeCamelized;
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

