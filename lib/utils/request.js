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

var request = new (function () {
  this.send = function (options) {
    var client
      , opts = options || {}
      , parsed = url.parse(opts.url)
      , requester = parsed.protocol == 'http:' ? http : https
      , port;

    if (parsed.port) {
      port = parsed.port;
    }
    else {
      port = parsed.protocol == 'http:' ? '80' : '443';
    }

    client = requester.request({
      host: parsed.hostname
    , port: port
    , method: (opts.method && opts.method.toUpperCase()) || 'GET'
    , agent: false
    , path: parsed.pathname + parsed.search
    , headers: opts.headers || {}
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
        opts.success(data);
      });
    });

    client.addListener('error', function (e) {
      opts.error(e);
    });

    client.end();
  };

})();

exports.request = request;
