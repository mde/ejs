var sys = require('sys');
var errors = require('./errors');
var response = require('./response');

var formatters = {
  json: function (content) {
    return JSON.stringify(content);
  },
  text: function (content) {
    return JSON.stringify(content);
  }
};

var Controller = function (params, req, resp) {
  this.respondsWith = ['text'];
  this.params = params;
  this.request = req;
  this.response = resp;
  this.content = '';
  this.format = '';
  this.contentType = '';
};

Controller.prototype = new function () {
  this.respond = function (content, format) {
    
    var negotiated = this.negotiateContent(format);
    this.format = negotiated[0];
    this.contentType = negotiated[1];

    if (!this.contentType) {
      throw new errors.NotAcceptableError('Not an acceptable media type.');
    }
    
    if (typeof content != 'undefined') {
      this.content = this.formatContent(content);
    }
    
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
    
    return [format, contentType];
  };

  this.formatContent = function (content) {
    var params = this.params;
    var ret;
    if (typeof content == 'string') {
      ret = content; 
    }
    else { 
      if (this.format) {
        ret = formatters[this.format](content);      
      }
      else {
        throw new errors.InternalServerError('Unknown format');
      }
    }
    return ret;
  };

}();

exports.Controller = Controller;

