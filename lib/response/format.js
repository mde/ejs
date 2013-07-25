var utils = require('utilities')
  , format
  , Format
  , builtInFormats;

builtInFormats = {
 'txt': {
    contentType: 'text/plain'
  , handler: function (content, controller, opts, callback) {
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
      callback(res);
    }
  }

, 'html': {
    contentType: 'text/html'
  , handler: function (content, controller, opts, callback) {
      controller.renderTemplate(content, opts, callback);
    }
  }

, 'json': {
    contentType: ['application/json', 'text/json']
  , handler: function (content, controller, opts, callback) {
      var res;
      if (content) {
        // JSON.stringify should automatically use .toJSON
        res = JSON.stringify(content);
      }
      else {
        res = '';
      }
      callback(res);
    }
  }

, 'xml': {
    contentType: ['application/xml', 'text/xml']
  , handler: function (content, controller, opts, callback) {
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
          res = geddy.XML.stringify(content, {name: name});
        }
      }
      else {
        content = '';
      }
      callback(res);
    }
  }

, 'js': {
    contentType: ['application/javascript', 'text/javascript']
  , handler: function (content, controller, opts, callback) {
      var params = controller.params
        , res;

      if (!params.callback) {
        err = new geddy.errors.InternalServerError('JSONP callback not defined.');
        controller.error(err);
      }
      if (content) {
        res = JSON.stringify(content);
      }
      else {
        res = '';
      }
      callback(params.callback + '(' + res + ');');
    }
  }

};

Format = function (name, contentType, handler) {
  var arr = typeof contentType == 'string' ?
    [contentType] : contentType;

  this.name = name;
  this.contentType = contentType
  this.handler = handler;
  this.preferredContentType = arr[0];
  this.acceptsContentTypePattern = new RegExp(
        arr.join('|').replace(/(\/)/g, "\\$1"));
};

format = new (function () {
  var builtIn;

  this.formats = {};

  this.addFormat = function (name, contentType, handler) {
    this.formats[name] = new Format(name, builtIn.contentType, builtIn.handler);
  };

  for (var p in builtInFormats) {
    builtIn = builtInFormats[p];
    this.addFormat(p, builtIn.contentType, builtIn.handler);
  }

})();


module.exports = format;
