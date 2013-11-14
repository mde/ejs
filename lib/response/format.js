var utils = require('utilities')
  , errors
  , format
  , Format
  , builtInFormats;

builtInFormats = {
 'txt': {
    contentType: 'text/plain'
  , formatter: function (content) {
      var res;
      if (content) {
        if (typeof content.toString == 'function') {
          res = content.toString();
        }
        else {
          res = JSON.stringify(content);
        }
      }
      else {
        res = '';
      }
      return res;
    }
  }

, 'html': {
    contentType: 'text/html'
  , formatter: function (content) {
      // HTML is a special case
      // Template rendering happens later, back in the controller
      return content;
    }
  }

, 'json': {
    contentType: ['application/json', 'text/json']
  , formatter: function (content) {
      var res;
      if (content) {
        // JSON.stringify automatically uses any toJSON defined
        // on the object
        res = JSON.stringify(content);
      }
      else {
        res = '';
      }
      return res;
    }
  }

, 'xml': {
    contentType: ['application/xml', 'text/xml']
  , formatter: function (content) {
      var res
        , name = ''
        , toXml;

      if (content) {
        toXml = content.toXml || content.toXML;
        if (typeof toXml == 'function') {
          res = toXml.call(content);
        }
        else {
          if (content.type) {
            name = content.type;
          }
          res = utils.XML.stringify(content, {name: name});
        }
      }
      else {
        content = '';
      }
      return res;
    }
  }

, 'js': {
    contentType: ['application/javascript', 'text/javascript']
  , formatter: function (content) {
      var params = this.params // Executed on controller instance
        , res
        , errors = errors || require('./errors');

      if (!params.callback) {
        throw new errors.InternalServerError('JSONP callback not defined.');
      }
      if (content) {
        res = JSON.stringify(content);
      }
      else {
        res = '';
      }
      return params.callback + '(' + res + ');';
    }
  }

};

Format = function (name, contentType, formatter) {
  var arr = typeof contentType == 'string' ?
    [contentType] : contentType;

  this.name = name;
  this.contentType = contentType
  this.formatter = formatter;
  this.preferredContentType = arr[0];
  this.acceptsContentTypePattern = new RegExp(
        arr.join('|').replace(/(\/)/g, "\\$1"));
};

format = new (function () {
  var builtIn;

  this.formats = {};

  this.addFormat = function (name, contentType, formatter) {
    this.formats[name] = new Format(name, contentType, formatter);
  };

  for (var p in builtInFormats) {
    builtIn = builtInFormats[p];
    this.addFormat(p, builtIn.contentType, builtIn.formatter);
  }

})();


module.exports = format;
