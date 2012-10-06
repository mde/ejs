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

/*
Config section should look like this:

, sessions: {
    store: 'memcache'
  , servers: ['127.0.0.1:11211']
  , key: 'sid'
  , expiry: 14 * 24 * 60 * 60

'servers' is your array of Memcache servers.
*/

var file = require('utilities').file
  , Memcached = file.requireLocal('memcached');

var Memcache = function (callback) {
  this.setup(callback);
};

Memcache.prototype = new (function () {
  var _sessions = {};

  this.setup = function (callback) {
    memcached = new Memcached(geddy.config.sessions.servers);
    memcached.on('failure', function (details) {
      sys.error( "Server " + details.server + " went down due to: " +
          details.messages.join(' '));
    });
    callback();
  };

  this.read = function (session, callback) {
    var sid = session.id;
    memcached.get(sid, function (err, result) {
      if (err) {
        geddy.log.error(err);
      }
      callback(result || {});
    });
  };

  this.write = function (session, callback) {
    var sid = session.id
      , data = session.data;
    memcached.set(sid, data, 10000, function (err, result) {
      if (err) {
        geddy.log.error(err);
      }
      callback();
    });
  };

})();

exports.Memcache = Memcache;


