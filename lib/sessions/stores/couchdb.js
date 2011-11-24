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

var http = require("http");

var Couchdb = function (callback) {
  this.setup(callback);
};

Couchdb.prototype = new function () {
  var _this = this;
  var _sessions = {};
  var _appCallback;

  this.setup = function (callback) {
    _appCallback = callback;
    this.request({url: '/' + geddy.config.sessions.dbName,
        method: 'GET'}, this.ensureSetup);
  };

  this.ensureSetup = function (response) {
    if (response.statusCode == 404) {
      _this.request({url: '/' + geddy.config.sessions.dbName,
          method: 'PUT'}, _this.ensureSetup);
    }
    else {
      _appCallback();
    }
  };

  this.read = function (session, callback) {
    var sid = session.id;
    _appCallback = callback;
    this.request({url: '/' + geddy.config.sessions.dbName +
        '/' + sid, method: 'GET'}, this.ensureRead);
  };

  this.ensureRead = function (response) {
    if (response.statusCode == 404) {
      _this.create(response);
    }
    else {
      var url = response.url;
      var sid = url.substr(url.lastIndexOf('/') + 1);
      var data = JSON.parse(response.body);
      _sessions[sid] = data;
      _appCallback(_sessions[sid]);
    }
  };

  this.create = function (response) {
    var url = response.url;
    var sid = url.substr(url.lastIndexOf('/') + 1);
    this.request({url: '/' + geddy.config.sessions.dbName +
        '/' + sid, method: 'PUT', data: {}}, this.ensureCreate);
  };

  this.ensureCreate = function (response) {
    if (response.statusCode == 201) {
      var url = response.url;
      var sid = url.substr(url.lastIndexOf('/') + 1);
      var data = JSON.parse(response.body);

      // Avoid another round-trip just to get _id and _rev
      delete data.ok;
      data._id = data.id;
      delete data.id;
      data._rev = data.rev;
      delete data.rev;

      _sessions[sid] = data;
      _appCallback(_sessions[sid]);
    }
    else {
      throw new Error('could not create CouchDB session.');
    }
  };

  this.write = function (session, callback) {
    var sid = session.id
      , data = session.data;
    this.request({url: '/' + geddy.config.sessions.dbName +
        '/' + sid, method: 'PUT', data: data}, this.ensureUpdate);
    _appCallback = callback;
  };

  this.ensureUpdate = function (response) {
    _appCallback();
  };

  // FIXME: Convert to use simple clients.couchdb.Client
  this.request = function (params, callback) {
    var req = {};
    req.url = params.url;
    req.method = params.method || 'GET';
    req.data = JSON.stringify(params.data) || null;

    var headers = {host: geddy.config.sessions.hostname};
    if (req.data) {
      headers['content-length'] = req.data.length;
    }

    var client = http.createClient(geddy.config.sessions.dbPort, geddy.config.sessions.hostname);
    var request = client.request(req.method, req.url, headers);
    //console.log(req.url);
    request.addListener('response', function (response) {
      //console.log("STATUS: " + response.statusCode);
      //console.log("HEADERS: " + JSON.stringify(response.headers));
      response.setEncoding("utf8");
      response.addListener("data", function (chunk) {
        //console.log("BODY: " + chunk);
        callback({
          url: req.url,
          statusCode: response.statusCode,
          body: chunk
        });
      });
    });
    if (req.data) {
      //console.log('PUT data:');
      //console.log(req.data);
      request.write(req.data);
    }
    request.end();
  };


}();


exports.Couchdb = Couchdb;

