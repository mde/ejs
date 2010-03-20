var sys = require('sys');
var errors = require('./errors');

var response = require('./response');

var Controller = function (req, resp) {
  this.respondsWith = ['text', 'html'];
  this.request = req;
  this.response = resp;
  this.content = '';
};

Controller.prototype = new function () {
  this.respond = function (content, responseType) {

    var contentType = this.negotiateContent(responseType);

    if (!contentType) {
      throw new errors.NotAcceptableError('Not an acceptable media type.');
    }
    
    if (typeof content != 'undefined') {
      this.content = content;
    }
    
    var r = new response.Response(this.response);
    r.send(this.content, contentType);
  };

  this.negotiateContent = function (responseType) {
    var contentType;
    var types;
    var match;
    if (responseType) {
      types = [responseType];
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
      pat = response.responseTypePatterns[types[i]];
      if (pat) { 
        for (var j = 0; j < a.length; j++) {
          match = a[j].match(pat);
          if (match) {
            contentType = match;
            break;
          }
        }
      }
      else {
        throw new errors.InternalServerError('Unknown responseType');
      }
      // Don't look at any more responseTypes if there's a match
      if (match) {
        break;
      }
    }
    
    if (!contentType && wildcard) {
      t = types[0];
      match = response.responseTypes[t];
      if (match) {
        contentType = match.split('|')[0];
      }
      else {
        throw new errors.InternalServerError('Unknown responseType');
      }
    }
    
    return contentType;
  };
}();

exports.Controller = Controller;

