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
var http = require('http')
  , https = require('https')
  , url = require('url')
  , uri = require('./uri').uri;

var formatters = {
  xml: function (data) {
    return data;
  }
, html: function (data) {
    return data;
  }
, txt: function (data) {
    return data;
  }
, json: function (data) {
    return JSON.parse(data);
  }
}

var request = function (options, callback) {
  var client
    , opts = options || {}
    , parsed = url.parse(opts.url)
    , requester = parsed.protocol == 'http:' ? http : https
    , method = (opts.method && opts.method.toUpperCase()) || 'GET'
    , headers = opts.headers || {}
    , contentLength
    , port;

  if (parsed.port) {
    port = parsed.port;
  }
  else {
    port = parsed.protocol == 'http:' ? '80' : '443';
  }

  if (method == 'POST' || method == 'PUT') {
    if (opts.data) {
      contentLength = opts.data.length;
    }
    else {
      contentLength = 0
    }
    headers['Content-Length'] = contentLength;
  }

  client = requester.request({
    host: parsed.hostname
  , port: port
  , method: method
  , agent: false
  , path: parsed.pathname + parsed.search
  , headers: headers
  });

  client.addListener('response', function (resp) {
    var data = ''
      , dataType;
    resp.addListener('data', function (chunk) {
      data += chunk.toString();
    });
    resp.addListener('end', function () {
      dataType = opts.dataType || uri.getFileExtension(parsed.pathname);
      if (formatters[dataType]) {
        data = formatters[dataType](data);
      }
      callback(null, data);
    });
  });

  client.addListener('error', function (e) {
    callback(e, null);
  });

  if ((method == 'POST' || method == 'PUT') && opts.data) {
    client.write(opts.data);
  }

  client.end();
};

exports.request = request;
