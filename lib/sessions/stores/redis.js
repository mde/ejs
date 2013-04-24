/*
 * Geddy JavaScript Web development framework
 * Copyright 2012 Matthew Eernisse (mde@fleegix.org)
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

/*
Config section should look like this:

, sessions: {
    store: 'redis'
  , server: {
        host : "127.0.0.1"
      , port : 6379
      , opts : {}
      , auth : "megasecret" // [optional] password
      , ns  : "sess:" // redis key prefix
	}
  , key: 'sid'
  , expiry: 14 * 24 * 60 * 60

'server' is your Redis server.
*/
var utils = require('utilities')
  , file = utils.file
  , RedisServer = file.requireLocal('redis');

var Redis = function (callback) {
  this.setup(callback);
};

Redis.prototype = new (function () {
  var _sessions = {};

  var _client;
  var _ns;

  var self = this;

  this.setup = function (callback) {
    var port = geddy.config.sessions.server.port || null;
    var host = geddy.config.sessions.server.host  || null;
    var opts = geddy.config.sessions.server.opts  || {};
    _ns = geddy.config.sessions.server.ns || "";
    _client = RedisServer.createClient(port, host, opts);
    _client.on("error", function (err) {
      utils.log.error("Redis error " + _client.host + ":" + _client.port + " - " + err);
    });

    if (geddy.config.sessions.server.auth) {
      _client.auth(geddy.config.sessions.server.auth);
    }

    callback();
  };

  this.read = function (session, callback) {
    var self = this
      , id = _ns + session.id;
    _client.hgetall(id, function (err, result) {
      var data;
	    if (err) {
        geddy.log.error(err);
      }
      data = self._deserialize(result || {});
      data = data.sessionData || {};
      callback(data);
	});
  };

  this.write = function (session, callback) {
    var id = _ns + session.id
    // Create top-level obj so you can actually unset values
    // by blowing away the entire session-data
      , data = {sessionData: session.data}
    data = this._serialize(data);
    _client.hmset(id, data, function (err) {
      if (err) {
        geddy.log.error(err);
      }
      if (geddy.config.sessions.expiry) {
        _client.expire(id, geddy.config.sessions.expiry)
      }
      callback();
    });
  };

  this._serialize = function (data) {
    var result = {};
    for (var k in data) {
      result[k] = JSON.stringify(data[k]);
    }
    return result;
  }

  this._deserialize = function (data) {
    var result = {};
    for (var k in data) {
      result[k] = JSON.parse(data[k]);
    }
    return result;
  }

})();

exports.Redis = Redis;


