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
  , errors = require('./errors');

var response = new function () {

  this.formats = {
    txt: 'text/plain',
    html: 'text/html',
    json: 'application/json|text/json',
    js: 'application/javascript|text/javascript',
    xml: 'application/xml|text/xml'
  };

  this.formatsReverseMap = {};
  this.formatPatterns = {};
  this.formatsPreferred = {};
  var formatTypes;
  for (var p in this.formats) {
    formatTypes = this.formats[p].split('|');
    this.formatsPreferred[p] = formatTypes[0];
    for (var i = 0; i < formatTypes.length; i++) {
      this.formatsReverseMap[formatTypes[i]] = p;
    }
    this.formatPatterns[p] = new RegExp(
        this.formats[p].replace(/(\/)/g, "\\$1"));
  }

  // From Paperboy, http://github.com/felixge/node-paperboy
  this.contentTypes = JSON.parse(fs.readFileSync(__dirname +
      '/content_types.json').toString());

  this.charsets = {
    'text/javascript': 'UTF-8',
    'text/html': 'UTF-8'
  };

}();

var Response = function (resp) {
  this.resp = resp;
};

Response.prototype = new function () {
  this.send = function (content, statusCode, headers) {
    var success = !errors.errorTypes[statusCode];
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
    var _this = this;
    var ext = geddy.uri.getFileExtension(filepath);
    var contentType = response.contentTypes[ext] || 'application/octet-stream';
    var encoding = 'binary';

    this.setHeaders(200, {'Content-Type': contentType});

    // From Paperboy, http://github.com/felixge/node-paperboy
    fs.open(filepath, 'r', 0666, function (err, fd) {
      var pos = 0;
      var streamChunk = function () {
        fs.read(fd, 16 * 1024, pos, encoding,
            function (err, chunk, bytesRead) {
          if (!chunk) {
            fs.close(fd);
            _this.resp.end();
            /*
            log.debug('FILE: sent static file ' + filepath + '\nFinished handling request in ' +
                ((new Date().getTime()) - _this.resp.startTime) + ' ms').flush();
            */
            return;
          }

          _this.resp.write(chunk, encoding);
          pos += bytesRead;

          streamChunk();
        });
      }
      streamChunk();
    });

  };

  this.setHeaders = function (statusCode, headers) {
    var contentType = headers['Content-Type'];
    var charset = response.charsets[contentType];
    if (charset) {
      contentType += '; charset: ' + charset;
      headers['Content-Type'] = contentType;
    }
    this.resp.statusCode = statusCode;
    for (var p in headers) {
      this.resp.setHeader(p, headers[p]);
    }
  };

  this.writeBody = function (content) {
    this.resp.write(content);
  };

  this.finish = function (success) {
    this.resp.end();
    if (success) {
      /*
      log.debug('Finished handling request in ' +
          ((new Date().getTime()) - this.resp.startTime) + ' ms').flush();
      */
    }
  };

}();

for (var p in response) { exports[p] = response[p]; }
exports.Response = Response;

