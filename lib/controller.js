var sys = require('sys');
var fs = require('fs');
var errors = require('./errors');
var response = require('./response');
var fleegix = require('./fleegix');

var Controller = function (name, params, req, resp) {
  // Content-type the controller can respond with -- assume
  // minimum of plaintext
  this.respondsWith = ['text'];
  // The name of the controller constructor function,
  // in CamelCase with uppercase initial letter
  this.name = name;
  // The name, in lowercase_with_underscores, used for
  // picking the template if any to attempt to render
  this.nameDeCamelized = fleegix.string.deCamelize(name);
  // The action gets passed these as an argument, but we keep
  // them here too to have access to the file extension, so
  // we can do content-negotiation
  this.params = params;
  // The http.ServerRequest passed to the 'request' event
  // callback function
  this.request = req;
  // The http.ServerResponse passed to the 'request' event
  // callback function
  this.response = resp;
  // Content to respond with -- can be an Object or String
  this.content = '';
  // High-level set of options which can represent multiple
  // content-types
  // 'text', 'json', 'xml', 'html'
  this.format = '';
  // Content-type of the response -- driven by the format, and
  // by what content-types the client accepts
  this.contentType = '';
};

Controller.prototype = new function () {
  
  this.formatters = {
    json: function (content) {
      return JSON.stringify(content);
    },
    text: function (content) {
      return JSON.stringify(content);
    }
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
    r.send(this.content, this.contentType);
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

  this.formatContent = function (format, content) {
    if (format == 'html') {
      var _this = this;
      var name = this.nameDeCamelized;
      var act = this.params.action;
      var path = 'app/views/' + name + '/' + act + '.html.ejs';
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) { throw err; }
        var templ = new fleegix.ejs.Template({text: data});
        templ.process({data: content});
        _this.formatContentAndFinish(templ.markup);
      });
    }
    else {
      var c = this.formatters[format](content);
      this.formatContentAndFinish(c);
    }
  };

}();

exports.Controller = Controller;

