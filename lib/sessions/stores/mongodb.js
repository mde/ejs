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
        host : 'localhost'
      , port : 27017
      , db : 'testDB'
      , collection : 'sessions'
      , user : "tom" // [optional] user
      , password: 'superpass' //[optional] password
	}
  , key: 'sid'
  , expiry: 14 * 24 * 60 * 60

'server' is your MongoDB server.

If don't provide an expiry in your config file your sessions will live forever.
*/
var file = require('utilities').file
  , mongo = file.requireLocal('mongodb-wrapper');

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
    var host = geddy.config.sessions.server.host  || 'localhost';
    var port = geddy.config.sessions.server.port || 27017;
    var db = geddy.config.sessions.server.db  || 'sessionDB';
    var prefix = geddy.config.sessions.server.prefix;
    var user = geddy.config.sessions.server.user || null;
    var password = geddy.config.sessions.server.password || null;

    sessionCollection = geddy.config.sessions.server.collection  || 'sessions';
    _key = geddy.config.sessions.key || 'sid';

    //Authentication will not work until mongodb-wrapper is updated. A fix
    //was just merged to master on April 18th, 2012
    _client = mongo.db(host, port, db, prefix, user, password);
    _client.collection(sessionCollection);

    //Mongo-wrapper offers lazy open/close so we can't really check if the client
    //exists because it always will exist.
    callback();
  };

  this.read = function (session, callback) {
    var query = {};
    query[_key] = session.id;
    _client[sessionCollection].findOne(query, function (err, result) {
	    if (err) {
        geddy.log.error(err);
      }
      callback(result || {});
  	});
  };

  this.write = function (sess, callback) {
    var session = sess.data;
    session[_key] = sess.id;

    if (geddy.config.sessions.expiry) {
      session.expiry = geddy.config.sessions.expiry;
    }

    _client[sessionCollection].save(session, function (err, result) {
      if (err) {
        geddy.log.error('foo' + err);
      }

      callback();
    });
  };

})();

exports.Mongodb = MongoDB;


