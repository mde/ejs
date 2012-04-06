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
    store: 'mongodb'
  , server: {
        host : "127.0.0.1"
      , port : 27017
      , db : 'testDB'
      , collection : 'sessions'
      , auth : "megasecret" // [optional] password
	}
  , key: 'sid'
  , expiry: 14 * 24 * 60 * 60

'server' is your MongoDB server.
*/


try {
  mongo = require('mongodb-wrapper');
}
catch(e) {
  throw new Error('The mongodb wrapper module could not be found. Try doing "npm install mongodb-wrapper."');
}

var MongoDB = function (callback) {
  this.setup(callback);
};

MongoDB.prototype = new (function () {
  var _sessions = {};
  
  var _client;
  var _key;
  var sessionCollection;
  
  var self = this;

  this.setup = function (callback) {
    var port = geddy.config.sessions.server.port || null;
    var host = geddy.config.sessions.server.host  || null;
    var db = geddy.config.sessions.server.db  || null;
    sessionCollection = geddy.config.sessions.server.collection  || 'sessions';
    _key = geddy.config.sessions.key || "sid";
    _client = mongo.db(port, host, db);
    _client.collection(sessionCollection);
    _client.on("error", function (err) {
      sys.error("MongoDB error " + _client.host + ":" + _client.port + " - " + err);
    });
	
    if (geddy.config.sessions.server.auth) {
      _client.auth(geddy.config.sessions.server.auth);
    }
	
    callback();
  };

  this.read = function (session, callback) {
    var query = {};
    query[_key] = session.id;
    _client.sessionCollection.findOne(query, function (err, result) {
	    if (err) {
          geddy.log.error(err);
        }
        callback(result || {});
	});
  };

  this.write = function (sess, callback) {
    var session = sess.data;
    session[_key] = sess.id;
    _client.sessionCollection.save(session, function (err, result) {
      if (err) {
        geddy.log.error(err);
      }
      if (geddy.config.sessions.expiry) {
        self.expire(id, geddy.config.sessions.expiry)
      }
      callback();
    });
  };

  this.expire = function (id, expiry) {
    
  };

})();

exports.MongoDB = MongoDB;


