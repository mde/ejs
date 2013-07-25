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

var fs = require('fs')
  , ServerResponse = require('http').OutgoingMessage
  , utils = require('utilities')
  , errors = require('./errors')
  , format = require('./format')
  , mime = require('mime')
  , Response;

var response = new function () {
  // From Paperboy, http://github.com/felixge/node-paperboy
  this.charsets = {
    'application/json': 'UTF-8',
    'text/javascript': 'UTF-8',
    'text/html': 'UTF-8'
  };

  this.getContentTypeForFormat = function (f) {
    var formatObj = format.formats[f];
    if (formatObj) {
      return formatObj.preferredContentType;
    }
  };

  this.matchAcceptHeaderContentType = function (accepts, type) {
    var formatObj = format.formats[type]
      , pat = formatObj && formatObj.acceptsContentTypePattern
      , match;
    if (pat) {
      for (var j = 0, jj = accepts.length; j < jj; j++) {
        match = accepts[j].match(pat);
        if (match) {
          return match;
        }
      }
    }
  };

  this.formatContent = function (f, content, controller, opts, callback) {
    var formatObj = format.formats[f];
    return formatObj.handler(content, controller, opts, callback);
  };

}();

Response = function (resp) {
  this.resp = resp;
  // Copy has-own props over from original
  utils.mixin(this, resp);
};

// Inherit from actual ServerResponse
Response.prototype = new ServerResponse();
Response.prototype.constructor = Response;

utils.mixin(Response.prototype, new (function () {

  // Override, delegate
  this.setHeaders = function (statusCode, headers) {
    var contentType = headers['Content-Type'];
    var charset = response.charsets[contentType];
    if (charset) {
      contentType += '; charset='+charset;
      headers['Content-Type'] = contentType;
    }
    this.resp.statusCode = statusCode;
    for (var p in headers) {
      this.resp.setHeader(p, headers[p]);
    }
  };

  // Custom methods
  this.send = function (content, statusCode, headers) {
    //var success = !errors.errorTypes[statusCode];
    var s = statusCode || 200;
    var h = headers || {};
    this.setHeaders(s, h);
    this.finalize(content);
  };

  this.finalize = function (content) {
    this.writeBody(content);
    this.finish();
  };

  this.sendFile = function (filepath) {
    var self = this
      , contentType = mime.lookup(filepath)
      , now = new Date()
      , expireTime = geddy.config.cacheControl.expires[contentType] ||
          geddy.config.cacheControl.expires.default || 0
      , expireDate = new Date(now.getTime() + (expireTime * 1000));

    var encoding = 'binary';

    fs.stat(filepath, function(err, stat) {
      if(err) {
        throw err;
      }
      else {
        self.setHeaders(200, {
          'Content-Type': contentType
        , 'Content-Length': stat.size
        , 'Last-Modified': stat.mtime.toUTCString()
        , 'Expires': expireDate.toUTCString()
        , 'Cache-Control': 'max-age=' + expireTime
        , 'Content-Length': stat.size || (stat.blksize * stat.blocks)
        });

        // From Paperboy, http://github.com/felixge/node-paperboy
        fs.open(filepath, 'r', 0666, function (err, fd) {
          var pos = 0
            , len = 0;
          var streamChunk = function () {
            fs.read(fd, 16 * 1024, pos, encoding,
                function (err, chunk, bytesRead) {
              if (!chunk) {
                fs.close(fd);
                self.resp._length = len;
                self.resp.end();
                return;
              }
              len += chunk.length;
              self.resp.write(chunk, encoding);
              pos += bytesRead;

              streamChunk();
            });
          }
          streamChunk();
        });
      }
    });
  };

  this.writeBody = function (c) {
    var content = c || ''
      , resp = this.resp;
    resp._length = resp._length || 0;
    resp._length += content.length;
    resp.write(content);
  };

  this.finish = function (success) {
    this.resp.end();
  };

  // Methods for so-called Connect-style middleware
  this.redirect = function () {
    var stat, url;
    // Express API, optional param comes first, WTF
    if (arguments.length == 2) {
      stat = arguments[0];
      url = arguments[1];
    }
    else {
      url = arguments[0];
    }
    this.controller.redirect(url);
  };

})());

response.Response = Response;

module.exports = response;
